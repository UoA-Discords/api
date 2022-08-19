/* eslint-disable @typescript-eslint/no-var-requires */
import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import * as OpenApiValidator from 'express-openapi-validator';

// initialize classes
import { UserDatabase, EntriesDatabases, OptOutDatabase } from './classes/Databases';
import './classes/Loggers';

// local imports
import { Config } from './global/Config';
import { customErrorHandler } from './middleware/customErrorHandler';
import { customRateLimiter } from './middleware/customRateLimiter';
import { EntryStates } from './shared/Types/Entries';
import { discordLogin, discordLogout, discordRefresh } from './handlers/loginProcess';
import { getAllStaff, getAllUsers, getUserById, patchUserPerms } from './handlers/userManagement';
import {
    deleteOptOut,
    likeEntry,
    makeOptOut,
    modifyEntryState,
    modifyEntryTags,
    setEntryFeatured,
} from './handlers/entryModification';
import {
    apply,
    getFeaturedEntries,
    getEntriesOfState,
    getAllEntries,
    getOptOutEntries,
    getSelfPendingEntries,
} from './handlers/core';
import { join } from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const apiSpec = require(`../openapi.json`);

// initialize app
export const app = express();
app.set(`trust proxy`, Config.numProxies);

// normal middleware
{
    app.use(cors());
    app.use(express.json());
    // applied before ratelimiting because we don't ratelimit these (and only these) endpoints
    app.use(`/spec`, express.static(`openapi.json`));
    app.use(`/api-docs`, swaggerUi.serve, swaggerUi.setup(apiSpec));

    app.use(customRateLimiter);
    app.use(
        OpenApiValidator.middleware({
            apiSpec: `./openapi.json`,
            validateResponses: true,
        }),
    );
}

// routes and handlers
{
    // other
    app.get(`/`, (_req, res) =>
        res.status(200).json({
            version: Config.version,
            startedAt: Config.startedAt,
            entryStats: {
                pending: UserDatabase.size,
                approved: EntriesDatabases[EntryStates.Approved].size,
                denied: EntriesDatabases[EntryStates.Denied].size,
                withdrawn: EntriesDatabases[EntryStates.Withdrawn].size,
                optOut: OptOutDatabase.size,
            },
            users: UserDatabase.size,
            applyRequirements: { ...Config.applyRequirements },
        }),
    );
    app.get(`/ip`, (req, res) => res.status(200).send(req.ip));

    // user management
    app.get(`/staff`, getAllStaff);
    app.patch(`/users/:id/perms`, patchUserPerms);
    app.get(`/users/:id`, getUserById);
    app.get(`/users`, getAllUsers);

    // login process
    app.get(`/discord/logout`, discordLogout);
    app.get(`/discord/refresh`, discordRefresh);
    app.get(`/discord/login`, discordLogin);
    app.use(`/discord/example`, express.static(join(`src`, `handlers`, `loginProcess`, `example.html`)));

    // entry modification
    app.patch(`/entries/:id/likes`, likeEntry);
    app.delete(`/entries/optout`, deleteOptOut);
    app.post(`/entries/optout`, makeOptOut);
    app.post(`/entries/:state/:id/featured`, setEntryFeatured);
    app.patch(`/entries/:state/:id/tags`, modifyEntryTags);
    app.patch(`/entries/:state/:id/state`, modifyEntryState);

    // core
    app.post(`/apply`, apply);
    app.get(`/entries/pending/me`, getSelfPendingEntries);
    app.get(`/entries/optout`, getOptOutEntries);
    app.get(`/entries/featured`, getFeaturedEntries);
    app.get(`/entries/:state`, getEntriesOfState);
    app.get(`/entries`, getAllEntries);
}

// error handling middleware
app.use(customErrorHandler);
