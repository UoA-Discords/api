import { Request, Response } from 'express';
import { unknownErrorResponse } from '../../functions/unknownErrorResponse';
import { OAuth2Routes, OAuth2Scopes } from 'discord-api-types/v10';
import { Config } from '../../global/Config';
import { randomBytes } from 'crypto';
import { AuthDiscordAPI } from '../../classes/AuthDiscordAPI';

const SCOPES: OAuth2Scopes[] = [OAuth2Scopes.Guilds, OAuth2Scopes.Identify];

export function makeAuthorizationLink(req: Request, res: Response): void {
    try {
        const state = randomBytes(16).toString(`hex`);

        AuthDiscordAPI.addWaitingState(req.ip, state);

        const params = new URLSearchParams();
        params.set(`response_type`, `code`);
        params.set(`client_id`, Config.discordClientID);
        params.set(`state`, state);
        params.set(`redirect_uri`, Config.discordRedirectURI);
        params.set(`prompt`, `consent`);
        params.set(`scope`, SCOPES.join(` `));

        res.status(200).json(`${OAuth2Routes.authorizationURL}?${params.toString()}`);
    } catch (error) {
        return unknownErrorResponse(req, res, error);
    }
}
