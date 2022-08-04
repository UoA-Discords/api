import { DatabaseManager } from './Template';
import { SiteUser } from '../../shared/Types/User';
import { EntryStates, PendingEntry } from '../../shared/Types/Entries';

export const UserDatabase = new DatabaseManager<SiteUser>(`users.json`, {}, `User`);

export const EntriesDatabases: Record<EntryStates, DatabaseManager> = {
    [EntryStates.PendingApproval]: new DatabaseManager<PendingEntry>(`entries_pending.json`, {}, `Pending server`),
    [EntryStates.Approved]: new DatabaseManager<PendingEntry>(`entries_approved.json`, {}, `Approved server`),
    [EntryStates.Denied]: new DatabaseManager<PendingEntry>(`entries_denied.json`, {}, `Denied server`),
    [EntryStates.Withdrawn]: new DatabaseManager<PendingEntry>(`entries_withdrawn.json`, {}, `Withdrawn server`),
};
