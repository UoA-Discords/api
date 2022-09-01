import { RequestHandler } from 'express';
import { EntriesDatabases, UserDatabase } from '../../classes/Databases';
import { Loggers } from '../../classes/Loggers';
import { validateSiteToken } from '../../functions/siteTokenFunctions';
import { EntryStates, FullEntry } from '../../shared/Types/Entries';
import { BasicUserInfo, UserPermissionLevels } from '../../shared/Types/User';

/**
 * Handler for changing the state of an entry.
 *
 * - Cannot change the state of any entry to **pending**.
 * - Requires Moderator or above for any state (excluding to/from **featured**).
 * - Requires Owner for any state change to/from **featured**.
 */
export const modifyEntryState: RequestHandler = (req, res) => {
    const token = validateSiteToken(req.get(`Authorization`));

    if (!token.valid) {
        return res.status(400).json(token.reason);
    }

    if (token.user.permissionLevel < UserPermissionLevels.Moderator) {
        res.setHeader(`Perms-RequiredLevel`, UserPermissionLevels.Moderator);
        res.setHeader(`Perms-CurrentLevel`, token.user.permissionLevel);
        return res.sendStatus(401);
    }

    /** The state we are trying to change the entry to. */
    const newState = req.body[`newState`] as EntryStates;
    if (
        typeof newState !== `number` ||
        !Number.isInteger(newState) ||
        newState < 0 ||
        newState > EntryStates.Withdrawn
    ) {
        return res.status(400).json({
            shortMessage: `Invalid New State`,
            longMessage: `The new state you specified either wasn't an integer, or didn't lie within the valid range (0 to ${EntryStates.Withdrawn} exclusive).`,
            fixMessage: `Try again with a valid permission level.`,
        });
    }

    /** The reason specified for withdrawal or denial, if applicable. */
    const reason = req.body[`reason`];
    if ((newState === EntryStates.Denied || newState === EntryStates.Withdrawn) && typeof reason !== `string`) {
        return res.status(400).json({
            shortMessage: `Missing Reason`,
            longMessage: `To deny or withdraw an entry, you must specify a reason in the request body.`,
            fixMessage: `Try again with a reason specified.`,
        });
    }

    /** State of the current entry, obtained from request parameters so in string form. */
    const state = req.params[`state`];

    /** ID of the entry we wish to change. */
    const id = req.params[`id`];

    if (state === undefined || id === undefined) {
        return res.status(400).json({
            shortMessage: `Unknown State or ID`,
            longMessage: `An unknown state or ID was specified in the request URL.`,
            fixMessage: null,
        });
    }

    /** State of the entry we wish to change. */
    const currentState = Number(state) as EntryStates;

    if (EntryStates[currentState] === undefined) {
        return res.status(400).json({
            shortMessage: `Invalid State`,
            longMessage: `An invalid state was specified in the request URL. Please specify a value between 0 and ${EntryStates.Withdrawn} (inclusive).`,
            fixMessage: null,
        });
    }

    // validate permissions for featured entries
    if (currentState === EntryStates.Featured || newState === EntryStates.Featured) {
        if (token.user.permissionLevel < UserPermissionLevels.Owner) {
            res.setHeader(`Perms-RequiredLevel`, UserPermissionLevels.Owner);
            res.setHeader(`Perms-CurrentLevel`, token.user.permissionLevel);
            return res.sendStatus(401);
        }
    }

    const entry = EntriesDatabases[currentState].get(id);

    if (entry === null) {
        return res.sendStatus(404);
    }

    if (entry.state === newState) {
        return res.sendStatus(204);
    }

    if (newState === EntryStates.Pending) {
        return res.status(400).json({
            shortMessage: `Invalid State`,
            longMessage: `Cannot set the state of an entry to pending (${EntryStates.Pending}).`,
            fixMessage: `Choose another entry state.`,
        });
    }

    const creator = UserDatabase.get(entry.createdBy.id);
    if (creator === null) {
        return res.status(400).json({
            shortMessage: `Invalid User`,
            longMessage: `The user who made this application doesn't exist.`,
            fixMessage: null,
        });
    }

    EntriesDatabases[currentState].remove(id);

    const actionUserInfo: BasicUserInfo = {
        id: token.user.id,
        username: token.user.username,
        discriminator: token.user.discriminator,
        avatar: token.user.avatar,
        permissionLevel: token.user.permissionLevel,
    };

    const baseNewEntry = {
        ...entry,
        stateActionDoneBy: actionUserInfo,
        stateActionDoneAt: new Date().toISOString(),
        stateActionReason: null,
    };

    switch (newState) {
        case EntryStates.Approved: {
            const newEntry: FullEntry<EntryStates.Approved> = {
                ...baseNewEntry,
                state: EntryStates.Approved,
            };
            EntriesDatabases[EntryStates.Approved].set(newEntry);
            break;
        }
        case EntryStates.Featured: {
            const newEntry: FullEntry<EntryStates.Featured> = {
                ...baseNewEntry,
                state: EntryStates.Featured,
            };
            EntriesDatabases[EntryStates.Featured].set(newEntry);
            break;
        }
        case EntryStates.Denied: {
            const newEntry: FullEntry<EntryStates.Denied> = {
                ...baseNewEntry,
                state: EntryStates.Denied,
                stateActionReason: reason as string,
            };
            EntriesDatabases[EntryStates.Denied].set(newEntry);
            break;
        }
        case EntryStates.Withdrawn: {
            const newEntry: FullEntry<EntryStates.Withdrawn> = {
                ...baseNewEntry,
                state: EntryStates.Withdrawn,
                stateActionReason: reason as string,
            };
            EntriesDatabases[EntryStates.Withdrawn].set(newEntry);
            break;
        }
        default:
            Loggers.error.log(`Unhandled entry state change, ${EntryStates[newState]} (${newState})`);
            return res.sendStatus(500);
    }

    // update the stats of the user who created this entry
    creator.myApplicationStats[currentState]--;
    creator.myApplicationStats[newState]++;
    UserDatabase.set(creator);

    // update the stats of the staff member who modified this entry's state
    token.user.myAdminStats[newState]++;
    UserDatabase.set(token.user);

    Loggers.entries.changes.log(
        `[${EntryStates[currentState]} -> ${EntryStates[newState]}] ${token.user.username}#${token.user.discriminator} updated ${entry.guildData.name} (code = ${entry.inviteCode}, id = ${entry.id})`,
    );

    return res.sendStatus(200);
};
