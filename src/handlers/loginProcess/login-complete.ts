import { RequestHandler } from 'express';
import { AuthDiscordAPI } from '../../classes/AuthDiscordAPI';
import { Loggers } from '../../classes/Loggers';
import { RESTPostOAuth2AccessTokenResult } from 'discord-api-types/v10';
import { SiteUser, UserPermissionLevels } from '../../shared/Types/User';
import { UserDatabase } from '../../classes/Databases';
import { getUserInfo } from '../../shared/DiscordAPI';
import { makeSiteToken } from '../../functions/siteTokenFunctions';
import { EntryStates } from '../../shared/Types/Entries';

/** Completes the Discord login process by upgrading an authorization code to an access token. */
export const discordLoginComplete: RequestHandler = async (req, res) => {
    const { code, state } = req.query;

    // basic input validation, should be done by express-openapi-validator, but just in case
    if (typeof code !== `string` || typeof state !== `string`) {
        return res.sendStatus(400);
    }

    // state validation, state for this ip must be what was given in `/login` endpoint
    {
        const expectedState = AuthDiscordAPI.getWaitingState(req.ip);
        if (expectedState === undefined) {
            return res.sendStatus(410);
        }

        if (expectedState !== state) {
            Loggers.sessions.state.log(`[WARNING] ${req.ip} (got ${state}, expected ${expectedState})`);
            return res.sendStatus(409);
        }

        AuthDiscordAPI.removeWaitingState(req.ip);
    }

    let discordAuth: RESTPostOAuth2AccessTokenResult;
    let userData: SiteUser | null;

    // get Discord access token from code
    try {
        discordAuth = await AuthDiscordAPI.getToken(code);
    } catch (error) {
        return res.status(400).json({
            shortMessage: `Invalid Auth Code`,
            longMessage: `An invalid authorization code was provided in the query.`,
            fixMessage: `Log in again.`,
        });
    }

    // get user data from Discord access token
    {
        const discordUser = await getUserInfo(discordAuth.access_token);
        if (discordUser === null) {
            return res.status(400).json({
                shortMessage: `Invalid Access Token`,
                longMessage: `An invalid access token was generated from the query authorization code.`,
                fixMessage: `Log in again.`,
            });
        }
        const { id, username, discriminator, avatar } = discordUser;

        userData = UserDatabase.get(id);

        if (userData !== null) {
            // user has logged in before, so update their details

            Loggers.sessions.main.log(`${username}#${discriminator} (${req.ip}) logged in`);

            AuthDiscordAPI.updateUserDiscordData(discordUser, userData, req.ip);
        } else {
            // user has not logged in before, so create their account

            Loggers.sessions.main.log(`${username}#${discriminator} (${req.ip}) logged in for the first time`);

            userData = {
                ip: req.ip,
                firstLogin: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                permissionLevel: UserPermissionLevels.Default,
                myApplicationStats: {
                    [EntryStates.Pending]: 0,
                    [EntryStates.Approved]: 0,
                    [EntryStates.Denied]: 0,
                    [EntryStates.Withdrawn]: 0,
                },
                myAdminStats: {
                    [EntryStates.Approved]: 0,
                    [EntryStates.Denied]: 0,
                    [EntryStates.Withdrawn]: 0,
                },
                likes: [],
                dislikes: [],
                id,
                username,
                discriminator,
                avatar,
            };

            if (discordUser.public_flags !== undefined) {
                userData.public_flags = discordUser.public_flags;
            }
        }

        // save the changes
        UserDatabase.set(userData);
    }

    // create site access token from Discord access token
    const siteAuth = makeSiteToken(discordAuth, userData.id);

    return res.status(200).json({ discordAuth, siteAuth, userData });
};
