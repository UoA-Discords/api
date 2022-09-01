import { RequestHandler } from 'express';
import { EntriesDatabases } from '../../classes/Databases';
import { EntryStates } from '../../shared/Types/Entries';

export const getAllEntries: RequestHandler = (_req, res) => {
    return res
        .status(200)
        .json([...EntriesDatabases[EntryStates.Approved].getAll(), ...EntriesDatabases[EntryStates.Featured].getAll()]);
};
