import {describe, expect, it} from 'vitest';
import type {OccurrenceValidationState} from '../descriptor/OccurrenceManager';
import {
    bucketServerErrorsByOccurrence,
    matchesFieldPath,
    matchesOccurrencePath,
    mergeServerErrors,
    serverErrorOccurrenceIndex,
} from './serverErrors';

function occ(index: number, ...messages: string[]): OccurrenceValidationState {
    return {index, breaksRequired: false, validationResults: messages.map(message => ({message}))};
}

describe('matchesFieldPath', () => {
    it('matches the field itself and descendants', () => {
        expect(matchesFieldPath('myField', 'myField')).toBe(true);
        expect(matchesFieldPath('mySet.title', 'mySet')).toBe(true);
        expect(matchesFieldPath('mySet[1].title', 'mySet')).toBe(true);
    });

    it('matches sibling occurrences of the field (field-level)', () => {
        expect(matchesFieldPath('tags[2]', 'tags')).toBe(true);
    });

    it('does not match a field sharing a prefix', () => {
        expect(matchesFieldPath('myFieldExtra', 'myField')).toBe(false);
        expect(matchesFieldPath('other', 'myField')).toBe(false);
    });
});

describe('matchesOccurrencePath', () => {
    it('matches the occurrence itself and its descendants', () => {
        expect(matchesOccurrencePath('tags', 'tags')).toBe(true);
        expect(matchesOccurrencePath('mySet[1].title', 'mySet[1].title')).toBe(true);
        expect(matchesOccurrencePath('mySet[1].title.x', 'mySet[1].title')).toBe(true);
    });

    it('does not match sibling occurrences', () => {
        expect(matchesOccurrencePath('tags[1]', 'tags')).toBe(false);
        expect(matchesOccurrencePath('tags[2]', 'tags[1]')).toBe(false);
    });
});

describe('serverErrorOccurrenceIndex', () => {
    it('resolves occurrence 0 when the index is omitted', () => {
        expect(serverErrorOccurrenceIndex('tags', 'tags')).toBe(0);
        expect(serverErrorOccurrenceIndex('tags.sub', 'tags')).toBe(0);
    });

    it('parses the occurrence index from the bracket', () => {
        expect(serverErrorOccurrenceIndex('tags[2]', 'tags')).toBe(2);
        expect(serverErrorOccurrenceIndex('tags[1].sub', 'tags')).toBe(1);
    });
});

describe('bucketServerErrorsByOccurrence', () => {
    it("groups a field's errors by occurrence index and tags them server+custom", () => {
        const entries = [
            {path: 'tags', message: 'a'},
            {path: 'tags[1]', message: 'b'},
            {path: 'tags[2]', message: 'c'},
        ];

        const map = bucketServerErrorsByOccurrence(entries, 'tags');

        expect([...map.keys()].sort()).toEqual([0, 1, 2]);
        expect(map.get(0)).toEqual([{message: 'a', custom: true, server: true}]);
        expect(map.get(1)).toEqual([{message: 'b', custom: true, server: true}]);
        expect(map.get(2)).toEqual([{message: 'c', custom: true, server: true}]);
    });

    it('ignores entries for other fields (boundary-safe)', () => {
        const map = bucketServerErrorsByOccurrence([{path: 'tagsExtra', message: 'x'}], 'tags');
        expect(map.size).toBe(0);
    });

    it('maps an exact nested-occurrence path to occurrence 0 of that leaf', () => {
        const map = bucketServerErrorsByOccurrence([{path: 'mySet[1].title', message: 'x'}], 'mySet[1].title');
        expect([...map.keys()]).toEqual([0]);
    });
});

describe('mergeServerErrors', () => {
    it('returns the same validation when there are no server errors', () => {
        const validation = [occ(0), occ(1)];
        expect(mergeServerErrors(validation, new Map())).toBe(validation);
    });

    it('places each error on its occurrence, ahead of client errors', () => {
        const validation = [occ(0), occ(1, 'client')];
        const map = new Map([[1, [{message: 'server', custom: true, server: true}]]]);

        const merged = mergeServerErrors(validation, map);

        expect(merged[0].validationResults).toEqual([]);
        expect(merged[1].validationResults).toEqual([
            {message: 'server', custom: true, server: true},
            {message: 'client'},
        ]);
    });

    it('falls back to occurrence 0 for indices past the current occurrence count', () => {
        const validation = [occ(0), occ(1)];
        const map = new Map([[5, [{message: 'stale', custom: true, server: true}]]]);

        const merged = mergeServerErrors(validation, map);

        expect(merged[0].validationResults).toEqual([{message: 'stale', custom: true, server: true}]);
        expect(merged[1].validationResults).toEqual([]);
    });

    it('synthesizes occurrence 0 when there is no validation yet', () => {
        const map = new Map([[0, [{message: 'server', custom: true, server: true}]]]);

        const merged = mergeServerErrors([], map);

        expect(merged).toHaveLength(1);
        expect(merged[0].validationResults).toEqual([{message: 'server', custom: true, server: true}]);
    });
});
