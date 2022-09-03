import { UserDatabase, EntriesDatabases } from '../../src/classes/Databases';
import { EntryStates, FullEntry, PendingEntry } from '../../src/shared/Types/Entries';
import { Colours } from '../../src/types/Colours';

/**
 * Checks all users referenced in entries exist in the database.
 *
 * Does not include `inviteCreatedBy`, although will provide statistics for it.
 */
function validateUsersExist() {
    const allUserIds = new Set(UserDatabase.getAllKeys());

    const inviteStats = {
        /** inviteCreatedBy is present and the user is registered. */
        registered: 0,
        /** inviteCreatedBy is present but the user is not registered */
        unregistered: 0,
        /** inviteCreatedBy is not present */
        missing: 0,
    };

    const discrepancies: string[] = [];

    const makeMessage = (
        entry: FullEntry<Exclude<EntryStates, EntryStates.Pending>> | PendingEntry,
        action: string,
        id: string,
    ): void => {
        discrepancies.push(
            `- ${Colours.FgMagenta}${entry.guildData.name}${Colours.Reset} (${Colours.FgCyan}${entry.id}${Colours.Reset}) was ${action} an unknown user with ID ${Colours.FgRed}${id}${Colours.Reset}`,
        );
    };

    for (const database of Object.values(EntriesDatabases)) {
        for (const entry of database.getAll()) {
            if (!allUserIds.has(entry.createdBy.id)) {
                makeMessage(entry, `created by`, entry.createdBy.id);
            }

            if (entry.inviteCreatedBy === null) {
                inviteStats.missing++;
            } else if (allUserIds.has(entry.inviteCreatedBy.id)) {
                inviteStats.registered++;
            } else {
                inviteStats.unregistered++;
            }

            if (entry.state === EntryStates.Pending) continue;

            const idToCheck = entry.stateActionDoneBy?.id;
            const action = `${EntryStates[entry.state].toLowerCase()} by`;

            if (idToCheck === undefined) {
                // stateActionDoneBy is null, meaning it was automated
                // we don't need to check that "automated" exists in the database
                // (because it doesn't)
                continue;
            }

            if (!allUserIds.has(idToCheck)) {
                makeMessage(entry, action, idToCheck);
            }
        }
    }

    if (discrepancies.length > 0) {
        console.log(
            `${Colours.FgRed}${discrepancies.length} Discrepanc${discrepancies.length !== 1 ? `ies` : `y`}${
                Colours.Reset
            }`,
        );
        console.log(discrepancies.join(`\n`));
    } else {
        console.log(`${Colours.FgGreen}✓ All users exist${Colours.Reset}`);
    }

    // invite stats
    {
        const total = inviteStats.missing + inviteStats.registered + inviteStats.unregistered;
        const pRegistered = Math.floor((100 * inviteStats.registered) / total);
        const pUnregistered = Math.floor((100 * inviteStats.unregistered) / total);
        const pMissing = Math.floor((100 * inviteStats.missing) / total);

        console.log(
            `- Invite stats: ${Colours.FgGreen}Registered: ${inviteStats.registered} (${pRegistered}%)${Colours.Reset}, ${Colours.FgYellow}Unregistered: ${inviteStats.unregistered} (${pUnregistered}%)${Colours.Reset}, ${Colours.FgMagenta}Missing: ${inviteStats.missing} (${pMissing}%)${Colours.Reset}`,
        );
    }
}

validateUsersExist();
