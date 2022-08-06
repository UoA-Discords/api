import { RouteWrapper } from '../../types/RouteWrapper';
import { getToken } from './getToken';
import { makeAuthorizationLink } from './makeAuthorizationLink';
import { refreshToken } from './refreshToken';
import { revokeToken } from './revokeToken';

export const discordAuthRoutes: RouteWrapper = (app, route) => {
    /** Must be GET since Discord will redirect here (under standard config). */
    app.get(`${route}/getToken`, getToken);
    app.post(`${route}/refreshToken`, refreshToken);
    app.post(`${route}/revokeToken`, revokeToken);
    app.post(`${route}/authorize`, makeAuthorizationLink);
};
