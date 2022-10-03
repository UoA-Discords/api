import { EntriesDatabases, UserDatabase } from '../classes/Databases';
import { Loggers } from '../classes/Loggers';
import { EntryStates, FullEntry, PendingEntry } from '../shared/Types/Entries';
import { BasicUserInfo } from '../shared/Types/User';
import { refreshEntry } from './refreshEntry';

/** Updates all users and entries with latest information from the Discord API. */
export async function routineUpdates(): Promise<void> {
    const overallStartTime = Date.now();
    const tempUserLibrary = new Map<string, BasicUserInfo>();

    Loggers.info.log(`Routine updates starting!`);

    const stateEntries = new Map<EntryStates, (FullEntry<Exclude<EntryStates, EntryStates.Pending>> | PendingEntry)[]>([
        [EntryStates.Pending, EntriesDatabases[EntryStates.Pending].getAll()],
        [EntryStates.Approved, EntriesDatabases[EntryStates.Approved].getAll()],
        [EntryStates.Featured, EntriesDatabases[EntryStates.Featured].getAll()],
        [EntryStates.Denied, EntriesDatabases[EntryStates.Denied].getAll()],
        [EntryStates.Withdrawn, EntriesDatabases[EntryStates.Withdrawn].getAll()],
    ]);

    // updating entry data
    for (const [state, entries] of stateEntries) {
        const originalNum = entries.length;
        const startTime = Date.now();
        for (const entry of entries) {
            if (!(await refreshEntry(entry, tempUserLibrary))) {
                Loggers.info.log(
                    `Failed to refresh ${EntryStates[state].toLowerCase()} entry ${entry.id} (${
                        entry.guildData.name
                    }). Aborting process, see error log for more info`,
                );
                return;
            }
        }
        Loggers.info.log(
            `Finished updating ${EntryStates[state].toLowerCase()} entries, (${originalNum} -> ${
                EntriesDatabases[state].size
            }) [${((Date.now() - startTime) / 1000).toFixed(1)}s]`,
        );
    }

    // updating user data
    for (const [id, user] of tempUserLibrary) {
        const existingUser = UserDatabase.get(id);
        if (existingUser !== null) {
            existingUser.avatar = user.avatar;
            existingUser.discriminator = user.discriminator;
            existingUser.username = user.username;
            UserDatabase.set(existingUser);
        }
    }
    Loggers.info.log(`Finished updating ${tempUserLibrary.size} users`);

    // updating entry user data
    let updatedEntries = 0;
    for (const state of [
        EntryStates.Pending,
        EntryStates.Approved,
        EntryStates.Featured,
        EntryStates.Denied,
        EntryStates.Withdrawn,
    ]) {
        for (const entry of EntriesDatabases[state].getAll()) {
            let modified = false;

            const createdBy = tempUserLibrary.get(entry.createdBy.id);
            if (createdBy !== undefined) {
                entry.createdBy = createdBy;
                modified = true;
            }

            if (entry.state !== EntryStates.Pending && entry.stateActionDoneBy !== null) {
                const stateActionDoneBy = tempUserLibrary.get(entry.stateActionDoneBy.id);
                if (stateActionDoneBy !== undefined) {
                    entry.stateActionDoneBy = stateActionDoneBy;
                    modified ||= true;
                }
            }

            if (modified) {
                EntriesDatabases[state].set(entry as never);
                updatedEntries++;
            }
        }
    }

    Loggers.info.log(
        `Finished updating users in ${updatedEntries} entries.`,
        `Route update complete in ${((Date.now() - overallStartTime) / 1000).toFixed(1)}s`,
    );
}
