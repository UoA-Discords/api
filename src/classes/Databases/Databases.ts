import { DatabaseManager } from './Template';
import { SiteUser } from '../../shared/Types/User';
import { EntryStates, PendingEntry } from '../../shared/Types/Entries';

export const UserDatabase = new DatabaseManager<SiteUser>(`users`, `User`);

export const EntriesDatabases: Record<EntryStates, DatabaseManager> = {
    [EntryStates.PendingApproval]: new DatabaseManager<PendingEntry>(`entries/pending`, `Pending server`),
    [EntryStates.Approved]: new DatabaseManager<PendingEntry>(`entries/approved`, `Approved server`),
    [EntryStates.Denied]: new DatabaseManager<PendingEntry>(`entries/denied`, `Denied server`),
    [EntryStates.Withdrawn]: new DatabaseManager<PendingEntry>(`entries/withdrawn`, `Withdrawn server`),
};
