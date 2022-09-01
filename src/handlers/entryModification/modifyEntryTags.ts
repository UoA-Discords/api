import { RequestHandler } from 'express';
import { EntriesDatabases } from '../../classes/Databases';
import { Loggers } from '../../classes/Loggers';
import { validateSiteToken } from '../../functions/siteTokenFunctions';
import { validateTagsArray } from '../../functions/validateTagsArray';
import { EntryFacultyTags, EntryStates } from '../../shared/Types/Entries';
import { UserPermissionLevels } from '../../shared/Types/User';

export const modifyEntryTags: RequestHandler = (req, res) => {
    const token = validateSiteToken(req.get(`Authorization`));

    if (!token.valid) {
        return res.status(400).json(token.reason);
    }

    if (token.user.permissionLevel < UserPermissionLevels.Moderator) {
        res.setHeader(`Perms-RequiredLevel`, UserPermissionLevels.Moderator);
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

    const currentState = Number(state) as EntryStates;

    if (EntryStates[currentState] === undefined) {
        return res.status(400).json({
            shortMessage: `Invalid State`,
            longMessage: `An invalid state was specified in the request URL. Please specify a value between 0 and ${EntryStates.Withdrawn} (inclusive).`,
            fixMessage: null,
        });
    }

    const tags = req.body[`tags`] as EntryFacultyTags[];
    if (!Array.isArray(tags)) {
        return res.status(400).json({
            shortMessage: `Invalid Request Body`,
            longMessage: `Tags must be an integer array.`,
            fixMessage: null,
        });
    }
    const tagValidation = validateTagsArray(tags);
    if (tagValidation !== true) {
        return res.status(400).json({
            shortMessage: `Invalid Tags`,
            longMessage: tagValidation.join(`\n`),
            fixMessage: `Try again with valid tags.`,
        });
    }

    const entry = EntriesDatabases[currentState].get(id);

    if (entry === null) {
        return res.sendStatus(404);
    }

    const prevTags = entry.facultyTags.slice();
    entry.facultyTags = tags;

    const addedTags = tags.filter((e) => !prevTags.includes(e)).map((e) => `${EntryFacultyTags[e]!}(${e})`);
    const removedTags = prevTags.filter((e) => !tags.includes(e)).map((e) => `${EntryFacultyTags[e]!}(${e})`);

    // only save and log changes if tags actually changed
    if (addedTags.length !== 0 || removedTags.length !== 0) {
        // doing `EntriesDatabases[entry.state].set(entry);` gives a TypeError :/
        switch (entry.state) {
            case EntryStates.Approved:
                EntriesDatabases[EntryStates.Approved].set(entry);
                break;
            case EntryStates.Featured:
                EntriesDatabases[EntryStates.Featured].set(entry);
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
            `[Tags] ${token.user.username}#${token.user.discriminator} changed tags for ${entry.guildData.name} (code = ${entry.inviteCode}, id = ${entry.id})`,
            `Added = [${addedTags.join(`, `)}]`,
            `Removed = [${removedTags.join(`, `)}]`,
        );
    }

    return res.sendStatus(200);
};
