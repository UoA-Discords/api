import { EntryFacultyTags } from '../shared/Types/Entries';

/**
 * Validates an array of tags from a request.
 *
 * Returns a list of error messages, or true if all tags are valid.
 */
export function validateTagsArray(tagArray: number[]): true | string[] {
    const output: string[] = [];

    const seenTags: Set<EntryFacultyTags> = new Set();

    for (let i = 0, len = tagArray.length; i < len; i++) {
        const tagNumber = tagArray[i];
        if (typeof tagNumber !== `number`) {
            output.push(`Tag at index ${i} is not an integer`);
            continue;
        }
        if (EntryFacultyTags[tagNumber] === undefined) {
            output.push(`Tag at index ${i} is not in the valid range (0 to ${EntryFacultyTags.Statistics} inclusive)`);
            continue;
        }

        if (seenTags.has(tagNumber)) {
            output.push(`Tag at index ${i} (${EntryFacultyTags[tagNumber]}) is included twice`);
            continue;
        }
        seenTags.add(tagNumber);
    }

    if (output.length) return output;
    return true;
}
