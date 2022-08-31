import { Colours } from '../../src/types/Colours';
import { UserDatabase, EntriesDatabases } from '../../src/classes/Databases';
import { BasicUserInfo, SiteUser, UserPermissionLevels } from '../../src/shared/Types/User';
import { makeRandomUser } from './helpers/userGen';
import { ApprovedEntry, DeniedEntry, EntryStates, PendingEntry, WithdrawnEntry } from '../../src/shared/Types/Entries';
import { randomDate, randomIp } from './helpers/genHelpers';
import { makeRandomEntry } from './helpers/entryGen';

const userParams: Record<UserPermissionLevels, number> = {
    [UserPermissionLevels.None]: 3,
    [UserPermissionLevels.Like]: 3,
    [UserPermissionLevels.Default]: 30,
    [UserPermissionLevels.Elevated]: 10,
    [UserPermissionLevels.Moderator]: 5,
    [UserPermissionLevels.Administrator]: 3,
    [UserPermissionLevels.Owner]: 1,
};

const entryParams: Record<EntryStates, number> = {
    [EntryStates.Pending]: 10,
    [EntryStates.Approved]: 30,
    [EntryStates.Denied]: 5,
    [EntryStates.Withdrawn]: 5,
};

function populateDatbases() {
    const userInfoMap: Record<string, SiteUser> = {};

    // clearing existing databases
    {
        console.log(`Clearing existing databases`);
        UserDatabase.remove(...UserDatabase.getAllKeys());

        for (const database of Object.values(EntriesDatabases)) {
            database.remove(...database.getAllKeys());
        }
    }

    // user generation
    {
        console.log(
            `Creating random users (${Object.keys(userParams)
                .map(
                    (e) =>
                        `${Colours.FgCyan}${userParams[e as unknown as UserPermissionLevels]}${Colours.Reset} ${
                            UserPermissionLevels[e as unknown as UserPermissionLevels]
                        }`,
                )
                .join(`, `)})`,
        );

        for (const key in userParams) {
            const permissionLevel = key as unknown as UserPermissionLevels;
            for (let i = 0; i < userParams[permissionLevel]; i++) {
                const user = {
                    ...makeRandomUser(),
                    permissionLevel: permissionLevel,
                    myApplicationStats: {
                        [EntryStates.Pending]: 0,
                        [EntryStates.Approved]: 0,
                        [EntryStates.Denied]: 0,
                        [EntryStates.Withdrawn]: 0,
                    },
                    myAdminStats: {
                        [EntryStates.Approved]: 0,
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
    }

    // entry generation
    {
        console.log(
            `Creating random entries (${Object.keys(entryParams)
                .map(
                    (e) =>
                        `${Colours.FgCyan}${userParams[e as unknown as EntryStates]}${Colours.Reset} ${
                            EntryStates[e as unknown as EntryStates]
                        }`,
                )
                .join(`, `)})`,
        );

        const userIds = Object.keys(userInfoMap);
        const randomExistingUser = (pred?: (e: SiteUser) => boolean) => {
            if (pred === undefined) {
                return userInfoMap[userIds[Math.floor(Math.random() * userIds.length)]!]!;
            }
            const IdPool = userIds.filter((e) => pred(userInfoMap[e]!));
            return userInfoMap[IdPool[Math.floor(Math.random() * IdPool.length)]!]!;
        };

        for (const key in entryParams) {
            const entryState = key as unknown as EntryStates;

            for (let i = 0; i < entryParams[entryState]; i++) {
                const creator = randomExistingUser();

                let inviteCreator: BasicUserInfo | undefined;
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
                } else {
                    // 33% chance for the invite to not have been created by a user (actual chance is much lower)
                    inviteCreator = undefined;
                }

                const entry = makeRandomEntry(creator, inviteCreator);

                switch (entryState) {
                    case EntryStates.Approved:
                        {
                            const approvedBy = randomExistingUser();
                            const fullEntry: ApprovedEntry = {
                                ...entry,
                                state: EntryStates.Approved,
                                approvedBy: {
                                    id: approvedBy.id,
                                    username: approvedBy.username,
                                    discriminator: approvedBy.discriminator,
                                    avatar: approvedBy.avatar,
                                    permissionLevel: approvedBy.permissionLevel,
                                },
                                approvedAt: randomDate(
                                    Date.now(),
                                    Math.max(
                                        new Date(entry.createdAt).getTime(),
                                        new Date(approvedBy.firstLogin).getTime(),
                                    ),
                                ),
                            };
                            EntriesDatabases[EntryStates.Approved].set(fullEntry);
                        }
                        break;
                    case EntryStates.Denied:
                        {
                            const deniedBy = randomExistingUser();
                            const fullEntry: DeniedEntry = {
                                ...entry,
                                state: EntryStates.Denied,
                                deniedBy: {
                                    id: deniedBy.id,
                                    username: deniedBy.username,
                                    discriminator: deniedBy.discriminator,
                                    avatar: deniedBy.avatar,
                                    permissionLevel: deniedBy.permissionLevel,
                                },
                                deniedAt: randomDate(
                                    Date.now(),
                                    Math.max(
                                        new Date(entry.createdAt).getTime(),
                                        new Date(deniedBy.firstLogin).getTime(),
                                    ),
                                ),
                                reason: [`reason A`, `reason B`, `reason C`][Math.floor(Math.random() * 3)]!,
                            };
                            EntriesDatabases[EntryStates.Denied].set(fullEntry);
                        }
                        break;
                    case EntryStates.Pending:
                        {
                            const fullEntry: PendingEntry = {
                                ...entry,
                                state: EntryStates.Pending,
                            };
                            EntriesDatabases[EntryStates.Pending].set(fullEntry);
                        }
                        break;
                    case EntryStates.Withdrawn:
                        {
                            // 10% chance that this withdrawal was automated
                            const isAutomated = i % 10 === 0;
                            const withdrawnBy = randomExistingUser();
                            const fullEntry: WithdrawnEntry = {
                                ...entry,
                                state: EntryStates.Withdrawn,
                                withdrawnAt: randomDate(Date.now(), new Date(entry.createdAt).getTime()),
                                reason: [`reason A`, `reason B`, `reason C`][Math.floor(Math.random() * 3)]!,
                            };

                            if (!isAutomated) {
                                fullEntry.withdrawnBy = {
                                    id: withdrawnBy.id,
                                    username: withdrawnBy.username,
                                    discriminator: withdrawnBy.discriminator,
                                    avatar: withdrawnBy.avatar,
                                    permissionLevel: withdrawnBy.permissionLevel,
                                };
                                fullEntry.withdrawnAt = randomDate(
                                    Date.now(),
                                    Math.max(
                                        new Date(entry.createdAt).getTime(),
                                        new Date(withdrawnBy.firstLogin).getTime(),
                                    ),
                                );
                            }

                            EntriesDatabases[EntryStates.Withdrawn].set(fullEntry);
                        }
                        break;
                }
            }
        }
    }
}

if (process.argv.includes(`--confirm`)) {
    populateDatbases();
} else {
    console.log(
        `${Colours.FgRed}WARNING${Colours.Reset} This will clear all current entries in the database. Type ${Colours.FgMagenta}y${Colours.Reset} to confirm.`,
    );
    process.stdin.once(`data`, (d) => {
        const input = d.toString().replace(/\W/g, ``).toLowerCase();

        if (input === `y`) {
            populateDatbases();
        } else {
            console.log(`Aborted`);
        }
    });
}
