import { Express } from 'express';

/**
 * @param {Express} app App to add routes to.
 * @param {string} route Parent root, e.g. "/discord".
 */
export type RouteWrapper = (app: Express, route: string) => void;
