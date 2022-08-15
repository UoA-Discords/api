import { DatabaseManager } from './Template';
import { SiteUser } from '../../shared/Types/User';
import { ApprovedEntry, DeniedEntry, EntryStates, PendingEntry, WithdrawnEntry } from '../../shared/Types/Entries';
import { OptOutGuild } from '../../types/OptOutGuild';

export const UserDatabase = new DatabaseManager<SiteUser>(`users`, `User`);

export const EntriesDatabases = {
    [EntryStates.Pending]: new DatabaseManager<PendingEntry>(`entries/pending`, `Pending server`),
    [EntryStates.Approved]: new DatabaseManager<ApprovedEntry>(`entries/approved`, `Approved server`),
    [EntryStates.Denied]: new DatabaseManager<DeniedEntry>(`entries/denied`, `Denied server`),
    [EntryStates.Withdrawn]: new DatabaseManager<WithdrawnEntry>(`entries/withdrawn`, `Withdrawn server`),
};

export const OptOutDatabase = new DatabaseManager<OptOutGuild>(`entries/optout`, `Opted-out server`);
