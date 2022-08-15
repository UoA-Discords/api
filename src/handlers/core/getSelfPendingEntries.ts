import { RequestHandler } from 'express';
import { EntriesDatabases } from '../../classes/Databases';
import { validateSiteToken } from '../../functions/siteTokenFunctions';
import { EntryStates } from '../../shared/Types/Entries';

export const getSelfPendingEntries: RequestHandler = (req, res) => {
    const token = validateSiteToken(req.get(`Authorization`));

    if (!token.valid) {
        return res.status(400).json(token.reason);
    }

    if (token.user.applicationStats.applied === 0) {
        return res.status(200).json([]);
    }

    const allPending = EntriesDatabases[EntryStates.Pending].getAll();

    const myPending = allPending.filter((e) => e.createdBy.id === token.user.id);

    return res.status(200).json(myPending);
};
