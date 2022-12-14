import { RequestHandler } from 'express';
import { EntriesDatabases } from '../../classes/Databases';
import { EntryStates } from '../../shared/Types/Entries';

export const getAllEntries: RequestHandler = (_req, res) => {
    return res
        .status(200)
        .json({
            approved: EntriesDatabases[EntryStates.Approved].getAll(),
            featured: EntriesDatabases[EntryStates.Featured].getAll(),
        });
};
