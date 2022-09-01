import axios from 'axios';
import { OAuth2Routes, RESTPostOAuth2AccessTokenResult, UserFlags } from 'discord-api-types/v10';
import { Config } from '../../global/Config';
import { SiteUser } from '../../shared/Types/User';
/**
 * Provides helper functions to various Discord handlers to:
 * - Construct and send OAuth requests.
 * - Store state.
 * - Log session activity.
 */
export abstract class AuthDiscordAPI {
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
    public static async getToken(code: string, redirectUri: string): Promise<RESTPostOAuth2AccessTokenResult> {
        const body = this.makeRequestBody();
        body.set(`code`, code);
        body.set(`redirect_uri`, redirectUri);
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
     * @throws Throws an error if the provided access token is invalid.
     */
    public static async revokeToken(token: string): Promise<void> {
        const body = this.makeRequestBody();
        body.set(`token`, token);

        await axios.post<void>(OAuth2Routes.tokenRevocationURL, body);
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

        siteUser.lastLogin = new Date().toISOString();
    }
}
