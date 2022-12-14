import { OAuth2Routes, OAuth2Scopes } from 'discord-api-types/v10';
import { randomBytes } from 'crypto';
import { Config } from '../../global/Config';

// we don't actually require the "Guilds" scope, this is just for the example
const SCOPES: OAuth2Scopes[] = [OAuth2Scopes.Guilds, OAuth2Scopes.Identify];

/** Creates an example Discord OAuth2 authorization link. */
export function discordLoginExample(): string {
    const state = randomBytes(16).toString(`hex`);

    const params = new URLSearchParams();
    params.set(`response_type`, `code`);
    params.set(`client_id`, Config.discordClientID);
    params.set(`state`, state);
    params.set(`redirect_uri`, `https://uoa-discords.com/login`);
    params.set(`prompt`, `consent`);
    params.set(`scope`, SCOPES.join(` `));

    return `${OAuth2Routes.authorizationURL}?${params.toString()}`;
}
