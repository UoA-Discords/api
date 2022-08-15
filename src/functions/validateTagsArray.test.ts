import { EntryFacultyTags } from '../shared/Types/Entries';
import { validateTagsArray } from './validateTagsArray';

describe(`validateTagsArray`, () => {
    it(`sees 0 length arrays as valid`, () => {
        expect(validateTagsArray([])).toBe(true);
    });

    it(`recognizes valid arrays`, () => {
        // mixed values
        const validArray1 = [EntryFacultyTags.Arts, EntryFacultyTags.Statistics, EntryFacultyTags.HealthAndMedicine];

        // lowest possible value
        const validArray2 = [EntryFacultyTags.Arts];

        // highest possible value
        const validArray3 = [EntryFacultyTags.Statistics];

        expect(validateTagsArray(validArray1)).toBe(true);
        expect(validateTagsArray(validArray2)).toBe(true);
        expect(validateTagsArray(validArray3)).toBe(true);
    });

    it(`recognizes invalid arrays`, () => {
        const invalidArray1 = [`not a number`, -1, 105, EntryFacultyTags.Business, EntryFacultyTags.Business];

        const res1 = validateTagsArray(invalidArray1 as number[]);

        expect(Array.isArray(res1));

        expect((res1 as Array<unknown>)[0]).toContain(`not an integer`);
        expect((res1 as Array<unknown>)[1]).toContain(`not in the valid range`);
        expect((res1 as Array<unknown>)[2]).toContain(`not in the valid range`);
        expect((res1 as Array<unknown>)[3]).toContain(`included twice`);

        expect(res1 as Array<unknown>).toHaveLength(4);
    });
});
