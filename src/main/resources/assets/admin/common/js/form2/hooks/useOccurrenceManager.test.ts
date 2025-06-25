import {describe, expect, it, vi} from 'vitest';
import {ValueTypes} from '../../data/ValueTypes';
import {Occurrences} from '../../form/Occurrences';
import type {TextLineConfig} from '../descriptor/InputTypeConfig';
import {OccurrenceManager} from '../descriptor/OccurrenceManager';
import {TextLineDescriptor} from '../descriptor/TextLineDescriptor';

vi.mock('../../util/Messages', () => ({
    i18n: (key: string, ..._args: unknown[]) => `#${key}#`,
}));

/**
 * Tests for the logic used in useOccurrenceManager.
 *
 * Since hooks can't be called outside React, these tests exercise
 * the same logic the hook uses: minFill computation, eager fill,
 * sync + re-fill, and malformed schema guards.
 */

function createManager(opts: {min?: number; max?: number; values?: string[]} = {}) {
    const {min = 0, max = 0, values = []} = opts;
    const occurrences = Occurrences.minmax(min, max);
    const config = TextLineDescriptor.readConfig({});
    const initialValues = values.map(v => ValueTypes.STRING.newValue(v));
    return {
        manager: new OccurrenceManager<TextLineConfig>(occurrences, TextLineDescriptor, config, initialValues),
        occurrences,
    };
}

/** Mirrors the minFill computation from useOccurrenceManager. */
function computeMinFill(occurrences: Occurrences): number {
    return Math.max(occurrences.getMinimum(), 1);
}

/** Mirrors the guarded fill loop from useOccurrenceManager. */
function fillTo(manager: OccurrenceManager, minFill: number): void {
    while (manager.getCount() < minFill) {
        const before = manager.getCount();
        manager.add();
        if (manager.getCount() === before) break;
    }
}

/** Mirrors the sync + re-fill from useOccurrenceManager. */
function syncAndFill(
    manager: OccurrenceManager,
    values: ReturnType<typeof ValueTypes.STRING.newValue>[],
    minFill: number,
): void {
    manager.setValues(values);
    fillTo(manager, minFill);
}

describe('useOccurrenceManager — logic', () => {
    describe('minFill computation', () => {
        it('returns minimum for multiple inputs (max > 1)', () => {
            expect(computeMinFill(Occurrences.minmax(2, 5))).toBe(2);
        });

        it('returns minimum for unlimited inputs (max = 0)', () => {
            expect(computeMinFill(Occurrences.minmax(3, 0))).toBe(3);
        });

        it('returns 1 for unlimited with no minimum', () => {
            expect(computeMinFill(Occurrences.minmax(0, 0))).toBe(1);
        });

        it('returns 1 for single required (1:1)', () => {
            expect(computeMinFill(Occurrences.minmax(1, 1))).toBe(1);
        });

        it('returns 1 for single optional (0:1)', () => {
            expect(computeMinFill(Occurrences.minmax(0, 1))).toBe(1);
        });
    });

    describe('eager fill', () => {
        it('fills 0:1 to 1 null value', () => {
            const {manager, occurrences} = createManager({min: 0, max: 1});
            fillTo(manager, computeMinFill(occurrences));
            expect(manager.getCount()).toBe(1);
            expect(manager.getValues()[0].isNull()).toBe(true);
        });

        it('fills 1:1 to 1 null value', () => {
            const {manager, occurrences} = createManager({min: 1, max: 1});
            fillTo(manager, computeMinFill(occurrences));
            expect(manager.getCount()).toBe(1);
        });

        it('fills 2:5 to 2 null values', () => {
            const {manager, occurrences} = createManager({min: 2, max: 5});
            fillTo(manager, computeMinFill(occurrences));
            expect(manager.getCount()).toBe(2);
        });

        it('fills 0:0 (unlimited optional) to 1 null value', () => {
            const {manager, occurrences} = createManager({min: 0, max: 0});
            fillTo(manager, computeMinFill(occurrences));
            expect(manager.getCount()).toBe(1);
            expect(manager.getValues()[0].isNull()).toBe(true);
        });

        it('does not overfill when initial values already meet minimum', () => {
            const {manager, occurrences} = createManager({min: 0, max: 1, values: ['hello']});
            fillTo(manager, computeMinFill(occurrences));
            expect(manager.getCount()).toBe(1);
            expect(manager.getValues()[0].getString()).toBe('hello');
        });
    });

    describe('malformed schema guard', () => {
        it('terminates when min > max for non-multiple (min=3, max=1)', () => {
            const {manager, occurrences} = createManager({min: 3, max: 1});
            fillTo(manager, computeMinFill(occurrences));
            // Should fill to max=1 and stop, not infinite loop
            expect(manager.getCount()).toBe(1);
        });

        it('terminates when min > max for multiple (min=5, max=2)', () => {
            const {manager, occurrences} = createManager({min: 5, max: 2});
            fillTo(manager, computeMinFill(occurrences));
            // Should fill to max=2 and stop, not infinite loop
            expect(manager.getCount()).toBe(2);
        });
    });

    describe('sync + re-fill', () => {
        it('re-fills to 1 after sync([]) on a 0:1 field', () => {
            const {manager, occurrences} = createManager({min: 0, max: 1, values: ['hello']});
            const minFill = computeMinFill(occurrences);
            expect(manager.getCount()).toBe(1);

            syncAndFill(manager, [], minFill);
            expect(manager.getCount()).toBe(1);
            expect(manager.getValues()[0].isNull()).toBe(true);
        });

        it('re-fills to minimum after sync([]) on a 2:5 field', () => {
            const {manager, occurrences} = createManager({min: 2, max: 5, values: ['a', 'b', 'c']});
            const minFill = computeMinFill(occurrences);
            expect(manager.getCount()).toBe(3);

            syncAndFill(manager, [], minFill);
            expect(manager.getCount()).toBe(2);
        });

        it('re-fills to 1 after sync([]) on a 0:0 field', () => {
            const {manager, occurrences} = createManager({min: 0, max: 0, values: ['a']});
            const minFill = computeMinFill(occurrences);

            syncAndFill(manager, [], minFill);
            expect(manager.getCount()).toBe(1);
            expect(manager.getValues()[0].isNull()).toBe(true);
        });

        it('preserves values when sync provides enough', () => {
            const {manager, occurrences} = createManager({min: 0, max: 1});
            const minFill = computeMinFill(occurrences);
            const values = [ValueTypes.STRING.newValue('kept')];

            syncAndFill(manager, values, minFill);
            expect(manager.getCount()).toBe(1);
            expect(manager.getValues()[0].getString()).toBe('kept');
        });

        it('terminates re-fill on malformed schema (min=3, max=1)', () => {
            const {manager, occurrences} = createManager({min: 3, max: 1, values: ['a']});
            const minFill = computeMinFill(occurrences);

            syncAndFill(manager, [], minFill);
            // Should fill to max=1 and stop
            expect(manager.getCount()).toBe(1);
        });
    });
});
