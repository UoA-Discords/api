import axios from 'axios';
import { EntriesDatabases, UserDatabase } from '../classes/Databases';
import { Loggers } from '../classes/Loggers';
import { Config } from '../global/Config';
import { InvalidInviteReasons, validateDiscordInvite } from '../shared/functions';
import { EntryStates, FullEntry, PendingEntry } from '../shared/Types/Entries';
import { BasicUserInfo } from '../shared/Types/User';

/**
 * Validates an entry still exists (both the invite and the guild) by checking via the Discord API.
 *
 * - Updates `memberCountHistory`, `guildData`, `inviteCreatedBy`
 * - Withdraws entries that are no longer valid.
 *
 * - Entirely skips withdrawn and denied servers since we don't (feasibly) have unlimited API requests, but will
 * still set `memberCountHistory` to 0 for them.
 *
 * @returns {Promise<boolean>} Whether the refresh was successful.
 */
export async function refreshEntry(
    entry: FullEntry<Exclude<EntryStates, EntryStates.Pending>> | PendingEntry,
    tempUserLibrary: Map<string, BasicUserInfo>,
    attemptNumber = 0,
): Promise<boolean> {
    // API requests don't grow on trees
    if (entry.state === EntryStates.Withdrawn || entry.state === EntryStates.Denied) {
        entry.memberCountHistory.push([0, 0]);
        entry.memberCountHistory = entry.memberCountHistory.slice(-30);
        return true;
    }

    const invite = await validateDiscordInvite(
        entry.inviteCode,
        Config.applyRequirements.memberCount,
        Config.applyRequirements.verificationLevel,
        UserDatabase.get,
    );

    if (invite.valid === false) {
        entry.memberCountHistory.push([0, 0]);
        entry.memberCountHistory = entry.memberCountHistory.slice(-30);

        if (invite.reason === InvalidInviteReasons.Unknown) {
            const error = invite.extra;
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 429 && attemptNumber === 0) {
                    const tryAfter = Number(error.response.headers[`retry-after`]);
                    if (Number.isInteger(tryAfter)) {
                        Loggers.info.log(`[WARN] Got ratelimited on refreshEntry, trying again after ${tryAfter}`);
                        await new Promise((res) => setTimeout(res, tryAfter * 1000));
                        return await refreshEntry(entry, tempUserLibrary, attemptNumber++);
                    }
                }
                Loggers.error.log(`AxiosError while refreshing entry`, {
                    id: entry.id,
                    inviteCode: entry.inviteCode,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    error,
                    attemptNumber,
                });
            } else {
                Loggers.error.log(`Unknown error while refreshing entry`, {
                    id: entry.id,
                    inviteCode: entry.inviteCode,
                    error,
                    attemptNumber,
                });
            }
            return false;
        }

        EntriesDatabases[entry.state].remove(entry.id);
        // withdraw existing entries, deny pending ones
        if (entry.state === EntryStates.Pending) {
            const newEntry: FullEntry<EntryStates.Denied> = {
                ...entry,
                state: EntryStates.Denied,
                stateActionDoneAt: new Date().toISOString(),
                stateActionDoneBy: null,
                stateActionReason: InvalidInviteReasons[invite.reason],
            };
            EntriesDatabases[EntryStates.Denied].set(newEntry);
        } else {
            const newEntry: FullEntry<EntryStates.Withdrawn> = {
                ...entry,
                state: EntryStates.Withdrawn,
                stateActionDoneAt: new Date().toISOString(),
                stateActionDoneBy: null,
                stateActionReason: InvalidInviteReasons[invite.reason],
            };
            EntriesDatabases[EntryStates.Withdrawn].set(newEntry);
        }
        return true;
    }

    entry.guildData = invite.guildData;

    entry.memberCountHistory.push([invite.onlineMembers, invite.totalMembers]);
    entry.memberCountHistory = entry.memberCountHistory.slice(-30);
    entry.inviteCreatedBy = invite.inviteCreatedBy;

    EntriesDatabases[entry.state].set(entry as never);

    if (invite.inviteCreatedBy !== null) {
        tempUserLibrary.set(invite.inviteCreatedBy.id, invite.inviteCreatedBy);
    }

    return true;
}
