import { UserDatabase, EntriesDatabases } from '../../src/classes/Databases';
import { Colours } from '../../src/types/Colours';

/** Validates user and entry likes by iterating over every entry and user. */
function validateLikes() {
    /** Expected number of likes per guild. */
    const expectedNumberOfLikes: Record<string, number> = {};

    // generate expected numbers based on each users' liked guilds
    for (const user of UserDatabase.getAll()) {
        for (const serverId of user.likes) {
            if (expectedNumberOfLikes[serverId] !== undefined) {
                expectedNumberOfLikes[serverId]++;
            } else {
                expectedNumberOfLikes[serverId] = 1;
            }
        }
    }

    const discrepancies: string[] = [];

    // iterating over every entry to check their number of likes is what we expect
    for (const database of Object.values(EntriesDatabases)) {
        for (const guild of database.getAll()) {
            if (guild.likes === 0 && expectedNumberOfLikes[guild.id] === undefined) continue;
            if (expectedNumberOfLikes[guild.id] !== guild.likes) {
                discrepancies.push(
                    `- ${Colours.FgMagenta}${guild.guildData.name}${Colours.Reset} (${Colours.FgCyan}${guild.id}${
                        Colours.Reset
                    }) has ${Colours.FgRed}${guild.likes}${Colours.Reset} likes, but has been liked by ${
                        Colours.FgRed
                    }${expectedNumberOfLikes[guild.id]}${Colours.Reset} users.`,
                );
            }
            delete expectedNumberOfLikes[guild.id];
        }
    }

    const leftoverGuilds = Object.keys(expectedNumberOfLikes);

    if (leftoverGuilds.length > 0) {
        for (const guildId of leftoverGuilds) {
            discrepancies.push(
                `- Guild ${Colours.FgCyan}${guildId}${Colours.Reset} is liked by ${Colours.FgRed}${expectedNumberOfLikes[guildId]}${Colours.Reset} users, but does not exist in any database.`,
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
        console.log(`${Colours.FgGreen}✓ Likes are all valid${Colours.Reset}`);
    }
}

validateLikes();
