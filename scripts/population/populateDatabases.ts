import { Colours } from '../../src/types/Colours';
import { UserDatabase, EntriesDatabases, OptOutDatabase } from '../../src/classes/Databases';
import { BasicUserInfo, SiteUser, UserPermissionLevels } from '../../src/shared/Types/User';
import { makeRandomUser } from './helpers/userGen';
import { EntryStates, FullEntry } from '../../src/shared/Types/Entries';
import { randomDate, randomIp } from './helpers/genHelpers';
import { makeRandomFullEntry, makeRandomPendingEntry } from './helpers/entryGen';
import { generateLikes } from './helpers/likeGen';

const userParams: Map<UserPermissionLevels, number> = new Map([
    [UserPermissionLevels.None, 3],
    [UserPermissionLevels.Like, 3],
    [UserPermissionLevels.Default, 30],
    [UserPermissionLevels.Elevated, 10],
    [UserPermissionLevels.Moderator, 5],
    [UserPermissionLevels.Administrator, 3],
    [UserPermissionLevels.Owner, 1],
]);

const entryParams: Map<EntryStates, number> = new Map([
    [EntryStates.Pending, 10],
    [EntryStates.Approved, 30],
    [EntryStates.Featured, 3],
    [EntryStates.Denied, 5],
    [EntryStates.Withdrawn, 5],
]);

function populateEntries(
    userInfoMap: Record<string, SiteUser>,
): Record<string, FullEntry<Exclude<EntryStates, EntryStates.Pending>>> {
    console.log(`Clearing existing entries...`);
    for (const database of Object.values(EntriesDatabases)) {
        database.remove(...database.getAllKeys());
    }
    OptOutDatabase.remove(...OptOutDatabase.getAllKeys());

    const output: Record<string, FullEntry<Exclude<EntryStates, EntryStates.Pending>>> = {};

    console.log(
        `Creating random entries (${[...entryParams.keys()]
            .map((e) => `${Colours.FgCyan}${entryParams[e]}${Colours.Reset} ${EntryStates[e]}`)
            .join(`, `)})`,
    );

    const userIds = Object.keys(userInfoMap);
    const randomExistingUser = () => userInfoMap[userIds[Math.floor(Math.random() * userIds.length)]];

    for (const entryState of entryParams.keys()) {
        for (let i = 0; i < entryParams[entryState]; i++) {
            const creator = randomExistingUser();

            let inviteCreator: BasicUserInfo | null = null;
            if (i % 3 === 0) {
                // 33% chance for a registered user to have made this invite
                const randExisting = randomExistingUser();
                inviteCreator = {
                    id: randExisting.id,
                    username: randExisting.username,
                    discriminator: randExisting.discriminator,
                    avatar: randExisting.avatar,
                    permissionLevel: randExisting.permissionLevel,
                };
            } else if (i % 3 === 1) {
                // 33% chance for a non-registered user to have made this invite
                inviteCreator = { ...makeRandomUser(), permissionLevel: UserPermissionLevels.Default };
            }
            // otherwise invite has not been created by a user (actual chance is much lower)

            const pendingEntry = makeRandomPendingEntry(creator, inviteCreator);

            if (entryState === EntryStates.Pending) {
                EntriesDatabases[EntryStates.Pending].set(pendingEntry);
                creator.myApplicationStats[EntryStates.Pending]++;
                continue;
            }

            const entryActionBy = randomExistingUser();
            const fullEntry = makeRandomFullEntry(entryActionBy, pendingEntry, entryState);
            if (fullEntry.state === EntryStates.Withdrawn && i % 3 === 0) {
                fullEntry.stateActionDoneBy = null;
                fullEntry.stateActionReason = `AUTOMATIC: some reason`;
            } else {
                entryActionBy.myAdminStats[entryState]++;
            }

            creator.myApplicationStats[entryState]++;

            EntriesDatabases[entryState].set(fullEntry as never);

            output[fullEntry.id] = fullEntry;
        }
    }

    return output;
}

function populateUsers(): Record<string, SiteUser> {
    console.log(`Clearing existing users...`);
    UserDatabase.remove(...UserDatabase.getAllKeys());

    const userInfoMap: Record<string, SiteUser> = {};

    console.log(
        `Creating random users (${[...userParams.keys()]
            .map((e) => `${Colours.FgCyan}${userParams[e]}${Colours.Reset} ${UserPermissionLevels[e]}`)
            .join(`, `)})`,
    );

    for (const permissionLevel of userParams.keys()) {
        for (let i = 0; i < userParams[permissionLevel]; i++) {
            const user = {
                ...makeRandomUser(),
                permissionLevel,
                myApplicationStats: {
                    [EntryStates.Pending]: 0,
                    [EntryStates.Approved]: 0,
                    [EntryStates.Featured]: 0,
                    [EntryStates.Denied]: 0,
                    [EntryStates.Withdrawn]: 0,
                },
                myAdminStats: {
                    [EntryStates.Approved]: 0,
                    [EntryStates.Featured]: 0,
                    [EntryStates.Denied]: 0,
                    [EntryStates.Withdrawn]: 0,
                },
                likes: [],
                avatar: null,
                lastLogin: randomDate(),
                firstLogin: ``,
                ip: randomIp(),
            };

            user.firstLogin = randomDate(new Date(user.lastLogin).getTime());

            UserDatabase.set(user);

            userInfoMap[user.id] = user;
        }
    }

    return userInfoMap;
}

function populateDatabases(entriesOnly: boolean, usersOnly: boolean) {
    let userInfoMap: Record<string, SiteUser>;

    if (entriesOnly) {
        userInfoMap = {};
        for (const user of UserDatabase.getAll()) {
            userInfoMap[user.id] = user;
        }
        return populateEntries(userInfoMap);
    }

    if (usersOnly) {
        return populateUsers();
    }

    userInfoMap = populateUsers();
    const entryInfoMap = populateEntries(userInfoMap);
    generateLikes(userInfoMap, entryInfoMap);

    for (const user of Object.values(userInfoMap)) {
        UserDatabase.set(user);
    }

    for (const entry of Object.values(entryInfoMap)) {
        EntriesDatabases[entry.state].set(entry as never);
    }

    return;
}

const entriesOnly = process.argv.includes(`--only=entries`);
const usersOnly = process.argv.includes(`--only=users`);
if (process.argv.includes(`--confirm`)) {
    populateDatabases(entriesOnly, usersOnly);
    console.log(`${Colours.FgGreen}Done!${Colours.Reset}`);
    process.exit();
} else {
    const affectedData = entriesOnly ? `existing entries` : usersOnly ? `existing users` : `existing entries and users`;

    const additionalArgTip =
        entriesOnly || usersOnly
            ? ``
            : `\nYou can alternatively provide ${Colours.FgCyan}--only=users${Colours.Reset} or ${Colours.FgCyan}--only=entries${Colours.Reset} to only destroy and create data for users or entries, respectively.\n`;

    console.log(
        `${Colours.FgRed}WARNING${Colours.Reset} This will delete all ${Colours.FgRed}${affectedData}${Colours.Reset} from the database.\nType ${Colours.FgMagenta}y${Colours.Reset} to confirm.\n${additionalArgTip}Use ${Colours.FgCyan}--confirm${Colours.Reset} to skip this message.`,
    );
    process.stdin.once(`data`, (d) => {
        const input = d.toString().replace(/\W/g, ``).toLowerCase();

        if (input === `y`) {
            populateDatabases(entriesOnly, usersOnly);
            console.log(`${Colours.FgGreen}Done!${Colours.Reset}`);
        } else {
            console.log(`Aborted`);
        }
        process.exit();
    });
}
