import { RequestHandler } from 'express';
import { AuthDiscordAPI } from '../../classes/AuthDiscordAPI';
import { Loggers } from '../../classes/Loggers';
import { validateSiteToken } from '../../functions/siteTokenFunctions';

export const discordLogout: RequestHandler = async (req, res) => {
    const token = validateSiteToken(req.get(`Authorization`)?.slice(`Bearer `.length));

    if (!token.valid) {
        return res.status(400).json(token.reason);
    }

    const { username, discriminator } = token.user;
    Loggers.sessions.main.log(`${username}#${discriminator} (${req.ip}) logged out`);

    try {
        await AuthDiscordAPI.revokeToken(token.payload.access_token);
    } catch (error) {
        return res.status(400).json({
            shortMessage: `Invalid Access Token`,
            longMessage: `An invalid access token was present in your site token payload.`,
            fixMessage: `Log out.`,
        });
    }

    return res.sendStatus(200);
};
