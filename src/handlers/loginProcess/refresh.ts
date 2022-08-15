import { RESTPostOAuth2AccessTokenResult } from 'discord-api-types/v10';
import { RequestHandler } from 'express';
import { AuthDiscordAPI } from '../../classes/AuthDiscordAPI';
import { UserDatabase } from '../../classes/Databases';
import { Loggers } from '../../classes/Loggers';
import { makeSiteToken, validateSiteToken } from '../../functions/siteTokenFunctions';
import { getUserInfo } from '../../shared/DiscordAPI';
import { UserPermissionLevels } from '../../shared/Types/User';

export const discordRefresh: RequestHandler = async (req, res) => {
    const token = validateSiteToken(req.get(`Authorization`));

    if (!token.valid) {
        return res.status(400).json(token.reason);
    }

    let discordAuth: RESTPostOAuth2AccessTokenResult;

    // check user has permission to refresh
    if (token.user.permissionLevel < UserPermissionLevels.LikeDislike) {
        res.setHeader(`Perms-RequiredLevel`, UserPermissionLevels.LikeDislike);
        res.setHeader(`Perms-CurrentLevel`, token.user.permissionLevel);
        return res.sendStatus(401);
    }

    // refresh Discord access token from refresh token
    try {
        discordAuth = await AuthDiscordAPI.refreshToken(token.payload.refresh_token);
    } catch (error) {
        return res.status(400).json({
            shortMessage: `Invalid Refresh Token`,
            longMessage: `An invalid refresh token was present in your access token payload.`,
            fixMessage: `Log out.`,
        });
    }

    // get updated user data from refreshed Discord access token
    {
        const discordUser = await getUserInfo(discordAuth.access_token);
        if (discordUser === null) {
            return res.status(400).json({
                shortMessage: `Invalid Access Token`,
                longMessage: `An invalid access token was generated from the refresh token.`,
                fixMessage: `Log out.`,
            });
        }

        const { id, username, discriminator } = discordUser;

        Loggers.sessions.main.log(`${username}#${discriminator} (${req.ip}) refreshed`);

        if (id !== token.payload.id) {
            Loggers.error.log(
                `${username}#${discriminator} (${req.ip}) somehow changed Discord ID on refresh (token = ${token.payload.id}, user = ${token.user.id}, new user = ${id})`,
            );
            return res.status(400).json({
                shortMessage: `Discord ID Changed`,
                longMessage: `We detected a change in your Discord ID, which shouldn't be possible.`,
                fixMessage: null,
            });
        }

        AuthDiscordAPI.updateUserDiscordData(discordUser, token.user, req.ip);

        // save the changes
        UserDatabase.set(token.user);
    }

    // create new site access token from Discord access token
    const siteAuth = makeSiteToken(discordAuth, token.payload.id);

    return res.status(200).json({ discordAuth, siteAuth, userData: token.user });
};
