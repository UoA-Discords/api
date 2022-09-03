import { EntryStates, FullEntry } from '../../../src/shared/Types/Entries';
import { SiteUser } from '../../../src/shared/Types/User';
import { Colours } from '../../../src/types/Colours';

/**
 * Makes a random portion of users have liked entries.
 *
 * Will modify both the user and the entry they liked accordingly.
 *
 * Does not save changes to the database.
 *
 * Returns an object containing an array of entries that were modified, indexed by state.
 */
export function generateLikes(
    userPool: Record<string, SiteUser>,
    entryPool: Record<string, FullEntry<Exclude<EntryStates, EntryStates.Pending>>>,
) {
    const userIds = Object.keys(userPool);
    const numUserIds = userIds.length;

    const entryIds = Object.keys(entryPool);
    const numEntryIds = entryIds.length;

    if (numUserIds === 0 || numEntryIds === 0) return;

    console.log(
        `Generating likes for a random proportion of ${Colours.FgCyan}${numUserIds}${Colours.Reset} users across ${Colours.FgCyan}${numEntryIds} entries`,
    );

    const percentLikers = 25 + Math.floor(Math.random() * 76); // 25 to 75 (inclusive)

    const numLikers = Math.floor((percentLikers / 100) * numUserIds);

    for (let i = 0; i < numLikers; i++) {
        const randomUserId = userIds[Math.floor(Math.random() * numUserIds)];
        const randomEntryId = entryIds[Math.floor(Math.random() * numEntryIds)];

        const user = userPool[randomUserId];
        const entry = entryPool[randomEntryId];

        if (user.likes.includes(randomEntryId)) continue;

        user.likes.push(randomEntryId);
        entry.likes++;
    }
}
