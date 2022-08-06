import { RouteWrapper } from '../../types/RouteWrapper';
import { getSiteUserById } from './getSiteUserById';
import { patchUserPermissionLevel } from './patchUserPermissionLevel';

/** Routes for getting data for a site user (NOT a Discord user). */
export const usersRoutes: RouteWrapper = (app, route) => {
    app.get(`${route}/:id`, getSiteUserById);
    app.patch(`${route}/:id/perms`, patchUserPermissionLevel);
};
