import { UserDatabase, EntriesDatabases } from '../../src/classes/Databases';
import { EntryStates } from '../../src/shared/Types/Entries';
import { SiteUser } from '../../src/shared/Types/User';
import { Colours } from '../../src/types/Colours';

/** Validates user application stats by iterating over every entry and user. */
function validateApplicationStats() {
    /** Application stats of each user, indexed by user ID. */
    const expectedApplicationStats: Record<string, SiteUser[`myApplicationStats`]> = {};

    // going over each entry to record what we expect each user's stats to be
    for (const state of [EntryStates.Pending, EntryStates.Approved, EntryStates.Denied, EntryStates.Withdrawn]) {
        for (const guild of EntriesDatabases[state].getAll()) {
            const createdBy = guild.createdBy.id;
            if (expectedApplicationStats[createdBy] === undefined) {
                expectedApplicationStats[createdBy] = {
                    [EntryStates.Pending]: 0,
                    [EntryStates.Approved]: 0,
                    [EntryStates.Denied]: 0,
                    [EntryStates.Withdrawn]: 0,
                };
            }
            expectedApplicationStats[createdBy]![state]!++;
        }
    }

    /** Checks if 2 application stats objects are the same. */
    const compareApplicationStats = (
        got: SiteUser[`myApplicationStats`],
        expected: SiteUser[`myApplicationStats`] | undefined,
    ): boolean => {
        if (expected === undefined) {
            return Object.values(got).every((e) => e === 0);
        }
        for (const k in got) {
            const key = k as unknown as keyof SiteUser[`myApplicationStats`];
            if (got[key] !== expected[key]) return false;
        }
        return true;
    };

    /** String representation of an application stats object. */
    const applicationStatsToString = (d: SiteUser[`myApplicationStats`]): string => {
        return Object.keys(d)
            .map((e) => {
                const k = e as unknown as keyof SiteUser[`myApplicationStats`];
                return `${EntryStates[k]}: ${d[k]}`;
            })
            .join(`, `);
    };

    /** Deletes key value pairs from both objects if their values are the same. */
    const deleteIdenticalValues = (
        got: SiteUser[`myApplicationStats`],
        expected: SiteUser[`myApplicationStats`] | undefined,
    ): void => {
        if (expected === undefined) return;
        for (const k in got) {
            const key = k as unknown as keyof SiteUser[`myApplicationStats`];
            if (got[key] === expected[key]) {
                delete got[key];
                delete expected[key];
            }
        }
    };

    const discrepancies: string[] = [];

    // iterating over every user to check their stats are what we expect
    for (const user of UserDatabase.getAll()) {
        const got = user.myApplicationStats;
        const expected = expectedApplicationStats[user.id];
        if (!compareApplicationStats(got, expected)) {
            deleteIdenticalValues(got, expected);

            discrepancies.push(
                `- ${Colours.FgMagenta}${user.username}#${user.discriminator}${Colours.Reset} (${Colours.FgCyan}${
                    user.id
                }${Colours.Reset}) got ${Colours.FgRed}${applicationStatsToString(got)}${Colours.Reset}, expected ${
                    Colours.FgRed
                }${expected === undefined ? `undefined` : applicationStatsToString(expected)}${Colours.Reset}`,
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
        console.log(`${Colours.FgGreen}✓ Application stats are all valid${Colours.Reset}`);
    }
}

validateApplicationStats();
