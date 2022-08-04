import { RouteWrapper } from '../types/RouteWrapper';
import { discordAuthRoutes } from './discordAuth';

export const appRoutes: RouteWrapper = (app) => {
    discordAuthRoutes(app, `/discord`);
};
