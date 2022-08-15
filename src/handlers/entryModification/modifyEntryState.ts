import { RequestHandler } from 'express';
import { EntriesDatabases, UserDatabase } from '../../classes/Databases';
import { Loggers } from '../../classes/Loggers';
import { validateSiteToken } from '../../functions/siteTokenFunctions';
import { ApprovedEntry, BaseEntry, DeniedEntry, Entry, EntryStates, WithdrawnEntry } from '../../shared/Types/Entries';
import { UserPermissionLevels } from '../../shared/Types/User';

function duplicateEntry(entry: Entry): BaseEntry {
    return {
        id: entry.id,
        state: entry.state,
        inviteCode: entry.inviteCode,
        guildData: entry.guildData,
        memberCountHistory: entry.memberCountHistory,
        createdById: entry.createdById,
        createdAt: entry.createdAt,
        likes: entry.likes,
        dislikes: entry.dislikes,
        facultyTags: entry.facultyTags,
    };
}

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

    const reason = req.body[`reason`];
    if ((newState === EntryStates.Denied || newState === EntryStates.Withdrawn) && typeof reason !== `string`) {
        return res.status(400).json({
            shortMessage: `Missing Reason`,
            longMessage: `To deny or withdraw an entry, you must specify a reason in the request body.`,
            fixMessage: `Try again with a reason specified.`,
        });
    }

    const { state, id } = req.params;
    if (state === undefined || id === undefined) {
        return res.status(400).json({
            shortMessage: `Unknown State or ID`,
            longMessage: `An unknown state or ID was specified in the request URL.`,
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

    if (entry.state === newState) {
        return res.sendStatus(204);
    }

    if (newState === EntryStates.Pending) {
        return res.status(400).json({
            shortMessage: `Invalid State`,
            longMessage: `Cannot set an entries state to pending (${EntryStates.Pending}).`,
            fixMessage: `Choose another entry state.`,
        });
    }

    const user = UserDatabase.get(entry.createdById);
    if (user === null) {
        return res.status(400).json({
            shortMessage: `Invalid User`,
            longMessage: `The user who made this application doesn't exist.`,
            fixMessage: null,
        });
    }

    // update user stats
    switch (currentState) {
        case EntryStates.Approved:
            user.applicationStats.approved--;
            break;
        case EntryStates.Denied:
            user.applicationStats.denied--;
            break;
        case EntryStates.Pending:
            user.applicationStats.applied--;
            break;
        case EntryStates.Withdrawn:
            user.applicationStats.withdrawn--;
            break;
    }

    EntriesDatabases[currentState].remove(entry.id);

    switch (newState) {
        case EntryStates.Approved: {
            user.applicationStats.approved++;
            const newEntry: ApprovedEntry = {
                ...duplicateEntry(entry),
                approvedById: token.user.id,
                approvedAt: new Date().toISOString(),
                state: EntryStates.Approved,
            };
            EntriesDatabases[EntryStates.Approved].set(newEntry);
            break;
        }
        case EntryStates.Denied: {
            user.applicationStats.denied++;
            const newEntry: DeniedEntry = {
                ...duplicateEntry(entry),
                deniedById: token.user.id,
                deniedAt: new Date().toISOString(),
                state: EntryStates.Denied,
                reason: reason as string,
            };
            EntriesDatabases[EntryStates.Denied].set(newEntry);
            break;
        }
        case EntryStates.Withdrawn: {
            user.applicationStats.withdrawn++;
            const newEntry: WithdrawnEntry = {
                ...duplicateEntry(entry),
                withdrawnById: token.user.id,
                withdrawnAt: new Date().toISOString(),
                state: EntryStates.Withdrawn,
                reason: reason as string,
            };
            EntriesDatabases[EntryStates.Withdrawn].set(newEntry);
            break;
        }
    }

    UserDatabase.set(user);

    Loggers.entries.changes.log(
        `[${EntryStates[currentState]} -> ${EntryStates[newState]}] ${token.user.username}#${token.user.discriminator} updated ${entry.guildData.name} (code = ${entry.inviteCode}, id = ${entry.id})`,
    );

    return res.sendStatus(200);
};
