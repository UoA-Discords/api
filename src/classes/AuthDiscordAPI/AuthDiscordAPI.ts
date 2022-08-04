import axios from 'axios';
import { OAuth2Routes, RESTPostOAuth2AccessTokenResult } from 'discord-api-types/v10';
import { Config } from '../../global/Config';
import { getUserInfo } from '../../shared/DiscordAPI';
import { Loggers } from '../Loggers';

export interface IpWaitingState {
    state: string;
    timeout: NodeJS.Timeout;
}

export abstract class AuthDiscordAPI {
    private static readonly _ipStateMap: Record<string, IpWaitingState> = {};

    private static makeRequestBody(): URLSearchParams {
        const params = new URLSearchParams();
        params.set(`client_id`, Config.discordClientID);
        params.set(`client_secret`, Config.discordClientSecret);
        return params;
    }

    public static async getToken(code: string): Promise<RESTPostOAuth2AccessTokenResult> {
        const body = this.makeRequestBody();
        body.set(`code`, code);
        body.set(`redirect_uri`, Config.discordRedirectURI);
        body.set(`grant_type`, `authorization_code`);

        const { data } = await axios.post<RESTPostOAuth2AccessTokenResult>(OAuth2Routes.tokenURL, body);
        return data;
    }

    public static async refreshToken(refreshToken: string): Promise<RESTPostOAuth2AccessTokenResult> {
        const body = this.makeRequestBody();
        body.set(`refresh_token`, refreshToken);
        body.set(`grant_type`, `refresh_token`);

        const { data } = await axios.post<RESTPostOAuth2AccessTokenResult>(OAuth2Routes.tokenURL, body);
        return data;
    }

    public static async revokeToken(token: string): Promise<boolean> {
        const body = this.makeRequestBody();
        body.set(`token`, token);

        const { data } = await axios.post<boolean>(OAuth2Routes.tokenRevocationURL, body);
        return data;
    }

    /** If the IP already exists in the record, it is overwritten. */
    public static addWaitingState(ip: string, state: string): void {
        const existing = this._ipStateMap[ip];
        if (existing !== undefined) {
            Loggers.sessions.state.log(`[Overwritten] ${ip} (${existing.state} -> ${state})`);
            existing.timeout.refresh();
            existing.state = state;
        } else {
            this._ipStateMap[ip] = {
                state,
                timeout: setTimeout(() => this.removeWaitingState_Automatic(ip), 1000 * 60 * 5),
            };
        }
    }

    private static removeWaitingState_Automatic(ip: string): void {
        Loggers.sessions.state.log(`[Expired] ${ip} (${this._ipStateMap[ip]?.state})`);
        clearTimeout(this._ipStateMap[ip]?.timeout);
        delete this._ipStateMap[ip];
    }

    public static removeWaitingState(ip: string): void {
        Loggers.sessions.state.log(`[Fulfilled] ${ip} (${this._ipStateMap[ip]?.state})`);
        clearTimeout(this._ipStateMap[ip]?.timeout);
        delete this._ipStateMap[ip];
    }

    public static getWaitingState(ip: string): string | undefined {
        return this._ipStateMap[ip]?.state;
    }

    public static async logUserAction(
        ip: string,
        accessToken: string,
        action: `logged in` | `logged out` | `refreshed`,
    ): Promise<void> {
        try {
            const { username, discriminator } = await getUserInfo(accessToken);
            Loggers.sessions.main.log(`${username}#${discriminator} (${ip}) ${action}`);
        } catch (error) {
            Loggers.error.log(`Failed to get user data for session logging, ip="${ip}", action="${action}"`);
        }
    }
}
