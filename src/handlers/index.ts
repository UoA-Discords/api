import { RouteWrapper } from '../types/RouteWrapper';
import { discordAuthRoutes } from './discordAuth';
import { usersRoutes } from './users';

export const appRoutes: RouteWrapper = (app) => {
    discordAuthRoutes(app, `/discord`);
    usersRoutes(app, `/users`);
};
