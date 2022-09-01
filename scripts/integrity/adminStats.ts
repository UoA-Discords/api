import { UserDatabase, EntriesDatabases } from '../../src/classes/Databases';
import { EntryStates } from '../../src/shared/Types/Entries';
import { SiteUser } from '../../src/shared/Types/User';
import { Colours } from '../../src/types/Colours';

/** Validates user admin stats by iterating over every entry and user. */
function validateAdminStats() {
    /** Admin stats of each user, indexed by user ID. */
    const expectedAdminStats: Record<string, SiteUser[`myAdminStats`]> = {};

    /** Adds a user to the expected record if they do not yet exist. */
    const addIfNonExistent = (userId: string, k: keyof SiteUser[`myAdminStats`]) => {
        if (expectedAdminStats[userId] === undefined) {
            expectedAdminStats[userId] = {
                [EntryStates.Approved]: 0,
                [EntryStates.Featured]: 0,
                [EntryStates.Denied]: 0,
                [EntryStates.Withdrawn]: 0,
            };
        }
        expectedAdminStats[userId]![k]! += 1;
    };

    for (const rState in EntriesDatabases) {
        const state = Number(rState) as EntryStates;
        if (state !== EntryStates.Pending) {
            for (const guild of EntriesDatabases[state]!.getAll()) {
                addIfNonExistent(guild.stateActionDoneBy?.id ?? `AUTOMATED`, state);
            }
        }
    }

    /** Checks if 2 admin stats objects are the same. */
    const compareAdminStats = (
        got: SiteUser[`myAdminStats`],
        expected: SiteUser[`myAdminStats`] | undefined,
    ): boolean => {
        if (expected === undefined) {
            return Object.values(got).every((e) => e === 0);
        }
        for (const k in got) {
            const key = k as unknown as keyof SiteUser[`myAdminStats`];
            if (got[key] !== expected[key]) return false;
        }
        return true;
    };

    /** String representation of an admin stats object. */
    const adminStatsToString = (d: SiteUser[`myAdminStats`]): string => {
        return Object.keys(d)
            .map((e) => {
                const k = e as unknown as keyof SiteUser[`myAdminStats`];
                return `${EntryStates[k]}(${k}): ${d[k]}`;
            })
            .join(`, `);
    };

    /** Deletes key value pairs from both objects if their values are the same. */
    const deleteIdenticalValues = (
        got: SiteUser[`myAdminStats`],
        expected: SiteUser[`myAdminStats`] | undefined,
    ): void => {
        if (expected === undefined) return;
        for (const k in got) {
            const key = k as unknown as keyof SiteUser[`myAdminStats`];
            if (got[key] === expected[key]) {
                delete got[key];
                delete expected[key];
            }
        }
    };

    const discrepancies: string[] = [];

    // iterating over every user to check their stats are what we expect
    for (const user of UserDatabase.getAll()) {
        const got = user.myAdminStats;
        const expected = expectedAdminStats[user.id];
        if (!compareAdminStats(got, expected)) {
            deleteIdenticalValues(got, expected);

            discrepancies.push(
                `- ${Colours.FgMagenta}${user.username}#${user.discriminator}${Colours.Reset} (${Colours.FgCyan}${
                    user.id
                }${Colours.Reset}) got ${Colours.FgRed}${adminStatsToString(got)}${Colours.Reset}, expected ${
                    Colours.FgRed
                }${expected === undefined ? `undefined` : adminStatsToString(expected)}${Colours.Reset}`,
            );
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
        console.log(`${Colours.FgGreen}✓ Admin stats are all valid${Colours.Reset}`);
    }
}

validateAdminStats();
