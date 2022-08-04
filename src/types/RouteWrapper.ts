import { Express } from 'express';

export type RouteWrapper = (app: Express, route: string) => void;
