import { BaseEntry, Entry } from '../../src/shared/Types/Entries';
import { BasicUserInfo, SiteUser } from '../../src/shared/Types/User';
import { randomDate, randomId } from './helpers/genHelpers';

/** Randomly generates a syntactically valid invide code (a-z, A-Z, 0-9). */
function randomInviteCode(): string {
    const length = 3 + Math.floor(Math.random() * 5); // 3 to 10 (inclusive)

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
const maxMembersFunctions: ((i: number) => number)[] = new Array(5);
{
    maxMembersFunctions[0] = (i) => 0.5 + 0.5 * Math.sin(i); // shifted sin(x)
    maxMembersFunctions[1] = (i) => 0.5 + 0.5 * Math.cos(i); // shifted cos(x)
    maxMembersFunctions[2] = (i) => Math.abs(Math.sin(i)); // absolute sin(x)
    maxMembersFunctions[3] = (i) => Math.abs(Math.cos(i)); // absolute cos(x)
    maxMembersFunctions[4] = (i) =>
        (maxMembersFunctions[0]!(i) +
            maxMembersFunctions[1]!(i) +
            maxMembersFunctions[2]!(i) +
            maxMembersFunctions[3]!(i)) /
        4; // average of all previous
}

function randomMemberCountHistory(createdAt: string): [number, number][] {
    const daysSince = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince === 0) return [];

    const maxMembersModifier = maxMembersFunctions[Math.floor(Math.random() * maxMembersFunctions.length)]!;
    const startingMembers = 100 + Math.floor(Math.random() * 901); // start with 100 to 1000 members (inclusive)

    // 10% to 90% of members will be online (inclusive)
    const percentOnline = (10 + Math.floor(Math.random() * 91)) / 100;

    return new Array<[number, number]>(Math.min(daysSince, 30)).fill([-1, -1]).map((_, i) => {
        if (i === 0) return [Math.floor(startingMembers * percentOnline), startingMembers];

        // continuous random value +/- 5
        const newTotal = Math.floor(startingMembers * maxMembersModifier(i)) - 5 + Math.floor(Math.random() * 11);
        const newOnline = Math.floor(newTotal * percentOnline);
        return [newOnline, newTotal];
    });
}

export function makeRandomEntry(createdBy: SiteUser, inviteCreatedBy?: BasicUserInfo): Omit<Entry, `state`> {
    const entry: Omit<Entry, `state`> = {
        id: randomId(),
        inviteCode: randomInviteCode(),
        guildData: {} as BaseEntry[`guildData`],
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
        facultyTags: [],
    };

    entry.memberCountHistory = randomMemberCountHistory(entry.createdAt);

    if (inviteCreatedBy !== undefined) {
        entry.inviteCreatedBy = inviteCreatedBy;
    }

    return entry;
}
