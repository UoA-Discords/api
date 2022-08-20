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
export const discordLogin: RequestHandler = async (req, res) => {
    const { code, redirect_uri } = req.body;

    // basic input validation, should be done by express-openapi-validator, but just in case
    if (typeof code !== `string` || typeof redirect_uri !== `string`) {
        return res.sendStatus(400);
    }

    let discordAuth: RESTPostOAuth2AccessTokenResult;
    let userData: SiteUser | null;

    // get Discord access token from code
    try {
        discordAuth = await AuthDiscordAPI.getToken(code, redirect_uri);
    } catch (error) {
        return res.status(400).json({
            shortMessage: `Invalid Body`,
            longMessage: `An invalid authorization code or redirect URI was provided in the query.`,
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

            // but first make sure they're allowed to log in
            if (userData.permissionLevel === UserPermissionLevels.None) {
                Loggers.sessions.main.log(`${username}#${discriminator} (${req.ip}) is not allowed to log in`);
                AuthDiscordAPI.revokeToken(discordAuth.access_token).catch(() => null);
                return res.sendStatus(401);
            }

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
