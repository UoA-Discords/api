import { RequestHandler } from 'express';
import { EntriesDatabases, UserDatabase } from '../../classes/Databases';
import { validateSiteToken } from '../../functions/siteTokenFunctions';
import { EntryStates } from '../../shared/Types/Entries';
import { UserPermissionLevels } from '../../shared/Types/User';

export const likeEntry: RequestHandler = (req, res) => {
    const token = validateSiteToken(req.get(`Authorization`));

    if (!token.valid) {
        return res.status(400).json(token.reason);
    }

    if (token.user.permissionLevel < UserPermissionLevels.Like) {
        res.setHeader(`Perms-RequiredLevel`, UserPermissionLevels.Like);
        res.setHeader(`Perms-CurrentLevel`, token.user.permissionLevel);
        return res.sendStatus(401);
    }

    const { id } = req.params;
    if (id === undefined) {
        return res.status(400).json({
            shortMessage: `Unknown ID`,
            longMessage: `An unknown ID was specified in the request URL.`,
            fixMessage: null,
        });
    }

    const { like } = req.body;
    if (typeof like !== `boolean`) return res.sendStatus(400);

    const entry = EntriesDatabases[EntryStates.Approved].get(id) ?? EntriesDatabases[EntryStates.Featured].get(id);

    if (entry === null) {
        return res.sendStatus(404);
    }

    const likeIndex = token.user.likes.indexOf(entry.id);

    if (like) {
        if (likeIndex !== -1) return res.sendStatus(200); // already liked
        token.user.likes.push(entry.id);
        entry.likes++;
    } else {
        if (likeIndex === -1) return res.sendStatus(200); // already unliked
        token.user.likes.splice(likeIndex, 1);
        entry.likes--;
    }

    UserDatabase.set(token.user);

    if (entry.state === EntryStates.Featured) {
        EntriesDatabases[EntryStates.Featured].set(entry);
    } else {
        EntriesDatabases[EntryStates.Approved].set(entry);
    }

    return res.sendStatus(200);
};
