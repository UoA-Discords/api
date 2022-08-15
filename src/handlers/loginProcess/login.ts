import { OAuth2Routes, OAuth2Scopes } from 'discord-api-types/v10';
import { RequestHandler } from 'express';
import { randomBytes } from 'crypto';
import { AuthDiscordAPI } from '../../classes/AuthDiscordAPI';
import { Config } from '../../global/Config';

const SCOPES: OAuth2Scopes[] = [OAuth2Scopes.Guilds, OAuth2Scopes.Identify];

/** Creates and redirects the client to a Discord OAuth2 authorization link. */
export const discordLogin: RequestHandler = (req, res) => {
    const state = randomBytes(16).toString(`hex`);

    AuthDiscordAPI.addWaitingState(req.ip, state);

    const params = new URLSearchParams();
    params.set(`response_type`, `code`);
    params.set(`client_id`, Config.discordClientID);
    params.set(`state`, state);
    params.set(`redirect_uri`, Config.discordRedirectURI);
    params.set(`prompt`, `consent`);
    params.set(`scope`, SCOPES.join(` `));

    return res.redirect(`${OAuth2Routes.authorizationURL}?${params.toString()}`);
};
