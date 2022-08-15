import { RequestHandler } from 'express';
import { EntriesDatabases } from '../../classes/Databases';
import { Loggers } from '../../classes/Loggers';
import { validateSiteToken } from '../../functions/siteTokenFunctions';
import { EntryStates } from '../../shared/Types/Entries';
import { UserPermissionLevels } from '../../shared/Types/User';

export const setEntryFeatured: RequestHandler = (req, res) => {
    const token = validateSiteToken(req.get(`Authorization`));

    if (!token.valid) {
        return res.status(400).json(token.reason);
    }

    if (token.user.permissionLevel < UserPermissionLevels.Owner) {
        res.setHeader(`Perms-RequiredLevel`, UserPermissionLevels.Owner);
        res.setHeader(`Perms-CurrentLevel`, token.user.permissionLevel);
        return res.sendStatus(401);
    }

    const { state, id } = req.params;
    if (state === undefined || id === undefined) {
        return res.status(400).json({
            shortMessage: `Unknown State or ID`,
            longMessage: `An unknown state or ID was specified in the request URL.`,
            fixMessage: null,
        });
    }

    const { isFeatured } = req.body;
    if (typeof isFeatured !== `boolean`) {
        return res.status(400).json({
            shortMessage: `Invalid Featured State`,
            longMessage: `The "isFeatured" request body must be a boolean.`,
            fixMessage: null,
        });
    }

    const currentState = Number(state) as EntryStates;

    if (EntryStates[currentState] === undefined) {
        return res.status(400).json({
            shortMessage: `Invalid State`,
            longMessage: `An invalid state was specified in the request URL. Please specify a value between 0 and ${EntryStates.Withdrawn} (inclusive).`,
            fixMessage: null,
        });
    }

    const entry = EntriesDatabases[currentState].get(id);

    if (entry === null) {
        return res.sendStatus(404);
    }

    // entry is already this featured state
    if (
        (entry.featured === undefined && isFeatured === false) ||
        (entry.featured !== undefined && isFeatured === true)
    ) {
        return res.sendStatus(200);
    }

    if (isFeatured === false) {
        delete entry.featured;
    } else {
        entry.featured = {
            featuredBy: {
                id: token.user.id,
                username: token.user.username,
                discriminator: token.user.discriminator,
                avatar: token.user.avatar,
                permissionLevel: token.user.permissionLevel,
            },
            featuredSince: new Date().toISOString(),
        };
    }

    // doing `EntriesDatabases[entry.state].set(entry);` gives a TypeError :/
    switch (entry.state) {
        case EntryStates.Approved:
            EntriesDatabases[EntryStates.Approved].set(entry);
            break;
        case EntryStates.Denied:
            EntriesDatabases[EntryStates.Denied].set(entry);
            break;
        case EntryStates.Pending:
            EntriesDatabases[EntryStates.Pending].set(entry);
            break;
        case EntryStates.Withdrawn:
            EntriesDatabases[EntryStates.Withdrawn].set(entry);
            break;
    }

    Loggers.entries.changes.log(
        `[Featured${isFeatured ? `+` : `-`}] ${token.user.username}#${token.user.discriminator} ${
            isFeatured ? `` : `un`
        }featured ${entry.guildData.name} (code = ${entry.inviteCode}, id = ${entry.id})`,
    );

    return res.sendStatus(200);
};
