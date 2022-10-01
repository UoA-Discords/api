import { GuildVerificationLevel } from 'discord-api-types/v10';
import { EntryFacultyTags, EntryStates, FullEntry, PendingEntry } from '../../../src/shared/Types/Entries';
import { BasicUserInfo, SiteUser } from '../../../src/shared/Types/User';
import { capitalize, randomAdjective, randomDate, randomId, randomNoun } from './genHelpers';

/** Randomly generates a syntactically valid invide code (a-z, A-Z, 0-9). */
function randomInviteCode(): string {
    const length = 3 + Math.floor(Math.random() * 8); // 3 to 10 (inclusive)

    return new Array(length)
        .fill(null)
        .map(() => {
            // each character can be a lowercase letter (a-z), an uppercase letter (A-Z), or a number (0-9)
            const char = Math.floor(Math.random() * (26 + 26 + 10));
            if (char < 26) {
                return String.fromCharCode(char + 97);
            }
            if (char < 52) {
                return String.fromCharCode(char + 39);
            }
            return (char - 52).toString();
        })
        .join(``);
}

/** Functions that provide dynamic modifiers (0-1) for generating random (but continuous) max member counts. */
const maxMembersFunctions: ((i: number) => number)[] = [
    (i) => 0.5 + 0.5 * Math.sin(i), // shifted sin(x)
    (i) => 0.5 + 0.5 * Math.cos(i), // shifted cos(x)
    (i) => Math.abs(Math.sin(i)), // absolute sin(x)
    (i) => Math.abs(Math.cos(i)), // absolute cos(x)
    (i) =>
        (maxMembersFunctions[0](i) +
            maxMembersFunctions[1](i) +
            maxMembersFunctions[2](i) +
            maxMembersFunctions[3](i)) /
        4, // average of all previous
];

function randomMemberCountHistory(createdAt: string): [number, number][] {
    const daysSince = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince === 0) return [];

    const maxMembersModifier = maxMembersFunctions[Math.floor(Math.random() * maxMembersFunctions.length)];
    const startingMembers = 100 + Math.floor(Math.random() * 901); // start with 100 to 1000 members (inclusive)

    // 10% to 90% of members will be online (inclusive)
    const percentOnline = (10 + Math.floor(Math.random() * 91)) / 100;

    const randomNumDays = 1 + Math.floor(Math.random() * 30); // 1 to 30 (inclusive)

    return new Array<[number, number]>(Math.min(daysSince, randomNumDays)).fill([-1, -1]).map((_, i) => {
        if (i === 0) return [Math.floor(startingMembers * percentOnline), startingMembers];

        // continuous random value +/- 5, but never < 1
        const newTotal = Math.max(
            Math.floor(startingMembers * maxMembersModifier(i)) - 5 + Math.floor(Math.random() * 11),
            1,
        );
        const newOnline = Math.floor(newTotal * percentOnline);
        return [newOnline, newTotal];
    });
}

function randomVerificationLevel(): GuildVerificationLevel {
    return Math.floor(Math.random() * (GuildVerificationLevel.VeryHigh + 1));
}

function randomGuildName(): string {
    const randomNounA = randomNoun();
    const randomNounB = randomNoun();

    return `${capitalize(randomNounA)} ${capitalize(randomNounB)}`;
}

function randomFacultyTags(): EntryFacultyTags[] {
    const numTags = Math.floor(Math.random() * 4); // 0 to 3 (inclusive)

    return new Array<EntryFacultyTags>(numTags)
        .fill(0)
        .map(() => Math.floor(Math.random() * (EntryFacultyTags.Statistics + 1)));
}

export function makeRandomPendingEntry(createdBy: SiteUser, inviteCreatedBy: BasicUserInfo | null): PendingEntry {
    const description =
        Math.random() < 0.5
            ? null
            : new Array(1 + Math.floor(Math.random() * 39))
                  .fill(``)
                  .map((e, i) => (i % 2 == 0 ? randomAdjective() : randomNoun()))
                  .join(` `);

    const entry: PendingEntry = {
        state: EntryStates.Pending,
        id: randomId(),
        inviteCode: randomInviteCode(),
        inviteCreatedBy,
        guildData: {
            name: randomGuildName(),
            icon: `fakeIconHash`,
            splash: null,
            banner: null,
            description,
            verificationLevel: randomVerificationLevel(),
        },
        memberCountHistory: [],
        createdBy: {
            id: createdBy.id,
            username: createdBy.username,
            discriminator: createdBy.discriminator,
            avatar: createdBy.avatar,
            permissionLevel: createdBy.permissionLevel,
        },
        createdAt: randomDate(Date.now(), new Date(createdBy.firstLogin).getTime()),
        likes: 0,
        facultyTags: randomFacultyTags(),
    };

    entry.memberCountHistory = randomMemberCountHistory(entry.createdAt);

    return entry;
}

export function makeRandomFullEntry<T extends Exclude<EntryStates, EntryStates.Pending>>(
    doneBy: SiteUser,
    pendingEntry: PendingEntry,
    state: T,
): FullEntry<T> {
    const stateActionDoneBy: BasicUserInfo = {
        id: doneBy.id,
        discriminator: doneBy.discriminator,
        username: doneBy.username,
        avatar: doneBy.avatar,
        permissionLevel: doneBy.permissionLevel,
    };

    const entry: FullEntry<T> = {
        ...pendingEntry,
        state,
        stateActionDoneBy,
        stateActionDoneAt: randomDate(
            Date.now(),
            Math.max(new Date(pendingEntry.createdAt).getTime(), new Date(doneBy.firstLogin).getTime()),
        ),
        stateActionReason: (state === EntryStates.Denied || state === EntryStates.Withdrawn
            ? `a reason`
            : null) as FullEntry<T>[`stateActionReason`],
    };

    return entry;
}
