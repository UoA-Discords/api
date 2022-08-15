import { RequestHandler } from 'express';
import { EntriesDatabases } from '../../classes/Databases';
import { validateSiteToken } from '../../functions/siteTokenFunctions';
import { Entry, EntryStates } from '../../shared/Types/Entries';
import { UserPermissionLevels } from '../../shared/Types/User';

export const getFeaturedEntries: RequestHandler = (req, res) => {
    const token = validateSiteToken(req.get(`Authorization`));

    if (!token.valid) {
        return res.status(400).json(token.reason);
    }

    if (token.user.permissionLevel < UserPermissionLevels.Moderator) {
        res.setHeader(`Perms-RequiredLevel`, UserPermissionLevels.Moderator);
        res.setHeader(`Perms-CurrentLevel`, token.user.permissionLevel);
        return res.sendStatus(401);
    }

    const allFeaturedEntries: Entry[] = [
        ...EntriesDatabases[EntryStates.Approved].getAll().filter((e) => e.featured),
        ...EntriesDatabases[EntryStates.Denied].getAll().filter((e) => e.featured),
        ...EntriesDatabases[EntryStates.Pending].getAll().filter((e) => e.featured),
        ...EntriesDatabases[EntryStates.Withdrawn].getAll().filter((e) => e.featured),
    ];

    return res.status(200).json(allFeaturedEntries);
};
