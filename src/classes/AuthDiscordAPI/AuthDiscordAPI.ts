import axios from 'axios';
import { OAuth2Routes, RESTPostOAuth2AccessTokenResult, UserFlags } from 'discord-api-types/v10';
import { Config } from '../../global/Config';
import { SiteUser } from '../../shared/Types/User';
import { Loggers } from '../Loggers';

export interface IpWaitingState {
    state: string;
    timeout: NodeJS.Timeout;
}

/**
 * Provides helper functions to various Discord handlers to:
 * - Construct and send OAuth requests.
 * - Store state.
 * - Log session activity.
 */
export abstract class AuthDiscordAPI {
    private static readonly _ipStateMap: Record<string, IpWaitingState> = {};

    private static makeRequestBody(): URLSearchParams {
        const params = new URLSearchParams();
        params.set(`client_id`, Config.discordClientID);
        params.set(`client_secret`, Config.discordClientSecret);
        return params;
    }

    /**
     * Makes a POST request to the Discord token URL, used to upgrade an
     * authorization code into an access token.
     * @param {String} code The authorization code returned by Discord.
     * @returns {RESTPostOAuth2AccessTokenResult} Access token information.
     * @throws Throws an error if the provided code is invalid.
     */
    public static async getToken(code: string): Promise<RESTPostOAuth2AccessTokenResult> {
        const body = this.makeRequestBody();
        body.set(`code`, code);
        body.set(`redirect_uri`, Config.discordRedirectURI);
        body.set(`grant_type`, `authorization_code`);

        const { data } = await axios.post<RESTPostOAuth2AccessTokenResult>(OAuth2Routes.tokenURL, body);
        return data;
    }

    /**
     * Makes a POST request to the Discord token refresh URL, used to delay
     * expiration of an access token.
     * @param {String} refreshToken The refresh token for the current access token.
     * @returns {RESTPostOAuth2AccessTokenResult} New access token information.
     * @throws Throws an error if the provided refresh token is invalid.
     */
    public static async refreshToken(refreshToken: string): Promise<RESTPostOAuth2AccessTokenResult> {
        const body = this.makeRequestBody();
        body.set(`refresh_token`, refreshToken);
        body.set(`grant_type`, `refresh_token`);

        const { data } = await axios.post<RESTPostOAuth2AccessTokenResult>(OAuth2Routes.tokenURL, body);
        return data;
    }

    /**
     * Makes a POST request to the Discord token revocation URL, used to invalidate
     * an access token.
     * @param {String} token The current access token.
     * @returns {boolean} Whether revocation was successful.
     * @throws Throws an error if the provided access token is invalid.
     */
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

    /**
     * State gets removed after the configured timeout threshold,
     * meaning the user did not authorize in time.
     */
    private static removeWaitingState_Automatic(ip: string): void {
        Loggers.sessions.state.log(`[Expired] ${ip} (${this._ipStateMap[ip]?.state})`);
        clearTimeout(this._ipStateMap[ip]?.timeout);
        delete this._ipStateMap[ip];
    }

    /** Manual state removal, for when a matching state and IP is received. */
    public static removeWaitingState(ip: string): void {
        Loggers.sessions.state.log(`[Fulfilled] ${ip} (${this._ipStateMap[ip]?.state})`);
        clearTimeout(this._ipStateMap[ip]?.timeout);
        delete this._ipStateMap[ip];
    }

    public static getWaitingState(ip: string): string | undefined {
        return this._ipStateMap[ip]?.state;
    }

    /**
     * Updates a SiteUser's Discord information, useful to call on refresh or login
     * of an existing user to make sure their information is up to date.
     *
     * Does not update the database entry of the user.
     */
    public static updateUserDiscordData(
        discordUser: {
            username: string;
            discriminator: string;
            avatar: string | null;
            public_flags?: UserFlags | undefined;
        },
        siteUser: SiteUser,
        ip: string,
    ): void {
        siteUser.ip = ip;
        siteUser.username = discordUser.username;
        siteUser.discriminator = discordUser.discriminator;
        siteUser.avatar = discordUser.avatar;

        if (discordUser.public_flags !== undefined) {
            siteUser.public_flags = discordUser.public_flags;
        } else delete siteUser.public_flags;
    }
}
