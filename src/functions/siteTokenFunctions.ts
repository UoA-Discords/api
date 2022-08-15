import { RESTPostOAuth2AccessTokenResult } from 'discord-api-types/rest/v10/oauth2';
import { Config } from '../global/Config';
import { sign, verify } from 'jsonwebtoken';
import { SiteUser } from '../shared/Types/User';
import { UserDatabase } from '../classes/Databases';

export interface SiteTokenPayload {
    /** Discord user ID, for finding user in database on each request. */
    id: string;

    access_token: string;

    refresh_token: string;
}

interface InvalidSiteTokenResponse {
    valid: false;
    reason: {
        shortMessage: string | null;
        longMessage: string | null;
        fixMessage: string | null;
    };
}

interface ValidSiteTokenResopnse {
    valid: true;
    payload: SiteTokenPayload;
    user: SiteUser;
}

type SiteTokenResponse = InvalidSiteTokenResponse | ValidSiteTokenResopnse;

export function makeSiteToken(discordAuthData: RESTPostOAuth2AccessTokenResult, id: string): string {
    const { access_token, refresh_token, expires_in } = discordAuthData;
    const payload: SiteTokenPayload = {
        id,
        access_token,
        refresh_token,
    };

    return sign(payload, Config.jwtSecret, {
        // site access token should expire at the same time as the Discord one
        expiresIn: expires_in,
    });
}

export function validateSiteToken(token: string | undefined): SiteTokenResponse {
    if (token === undefined) {
        return {
            valid: false,
            reason: {
                shortMessage: `Missing Access Token`,
                longMessage: `No access token was provided in the "Authorization" header of your request. Please ensure you include one (obtained from the "/discord/login" endpoint), e.g. "Bearer abc...xyz".`,
                fixMessage: `Log out and then log back in.`,
            },
        };
    }

    if (token.startsWith(`Bearer `)) token = token.slice(`Bearer `.length);

    try {
        const payload = verify(token, Config.jwtSecret);
        if (typeof payload === `string`) throw `Token has invalid payload type (got string, expected object)`;
        if (payload.exp === undefined) throw `Token lacks an expiration date`;
        if (payload.exp * 1000 < Date.now()) throw `Token expired`;

        if (payload[`id`] === undefined || typeof payload[`id`] !== `string`) throw `No ID in payload`;

        if (payload[`access_token`] === undefined || typeof payload[`access_token`] !== `string`) {
            throw `No access_token in payload`;
        }

        if (payload[`refresh_token`] === undefined || typeof payload[`refresh_token`] !== `string`) {
            throw `No refresh_token in payload`;
        }

        const user = UserDatabase.get(payload[`id`]);
        if (user === null) {
            return {
                valid: false,
                reason: {
                    shortMessage: `Unrecognized Access Token`,
                    longMessage: `A valid access token was provided, but a user with your ID was not found in the database.`,
                    fixMessage: `Log out and then log back in, this will hopefully create a user in the database for you.`,
                },
            };
        }

        if (user.id !== payload[`id`]) {
            throw `ID discrepancy between payload and user (${user.username}#${user.discriminator})`;
        }

        return {
            valid: true,
            payload: {
                id: payload[`id`],
                access_token: payload[`access_token`],
                refresh_token: payload[`refresh_token`],
            },
            user,
        };
    } catch (error) {
        return {
            valid: false,
            reason: {
                shortMessage: `Invalid Access Token`,
                longMessage:
                    error instanceof String
                        ? `An invalid access token was provided: ${error}.`
                        : `An invalid access token was provided, it may have been signed with a different secret key.`,
                fixMessage: `Log out and then log back in.`,
            },
        };
    }
}
