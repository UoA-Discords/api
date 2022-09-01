import { DatabaseManager } from './Template';
import { SiteUser } from '../../shared/Types/User';
import { EntryStates, FullEntry, PendingEntry } from '../../shared/Types/Entries';
import { OptOutGuild } from '../../types/OptOutGuild';

export const UserDatabase = new DatabaseManager<SiteUser>(`users`, `User`);

export const EntriesDatabases = {
    [EntryStates.Pending]: new DatabaseManager<PendingEntry>(`entries/pending`, `Pending server`),
    [EntryStates.Approved]: new DatabaseManager<FullEntry<EntryStates.Approved>>(`entries/approved`, `Approved server`),
    [EntryStates.Featured]: new DatabaseManager<FullEntry<EntryStates.Featured>>(`entries/featured`, `Featured server`),
    [EntryStates.Denied]: new DatabaseManager<FullEntry<EntryStates.Denied>>(`entries/denied`, `Denied server`),
    [EntryStates.Withdrawn]: new DatabaseManager<FullEntry<EntryStates.Withdrawn>>(
        `entries/withdrawn`,
        `Withdrawn server`,
    ),
};

export const OptOutDatabase = new DatabaseManager<OptOutGuild>(`entries/optout`, `Opted-out server`);
