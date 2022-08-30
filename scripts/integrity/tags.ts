import { EntriesDatabases } from '../../src/classes/Databases';
import { EntryFacultyTags } from '../../src/shared/Types/Entries';
import { Colours } from '../../src/types/Colours';

/** Validates entry faculty tags. */
function validateTags() {
    const discrepancies: string[] = [];

    for (const database of Object.values(EntriesDatabases)) {
        for (const guild of database.getAll()) {
            for (const tag of guild.facultyTags) {
                if (tag < 0 || tag > EntryFacultyTags.Statistics || !Number.isInteger(tag)) {
                    discrepancies.push(
                        `- Guild ${Colours.FgCyan}${guild.id}${Colours.Reset} has unrecognized tag: ${Colours.FgRed}${tag}${Colours.Reset}.`,
                    );
                }
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
        console.log(`${Colours.FgGreen}✓ All tags are valid${Colours.Reset}`);
    }
}

validateTags();
