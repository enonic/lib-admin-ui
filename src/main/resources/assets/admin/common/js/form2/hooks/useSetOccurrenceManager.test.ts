import {describe, expect, it} from 'vitest';
import {PropertyTree} from '../../data/PropertyTree';
import {Occurrences} from '../../form/Occurrences';
import {SetOccurrenceManager} from '../descriptor/SetOccurrenceManager';

/**
 * Tests for the logic used in useSetOccurrenceManager.
 *
 * Since hooks can't be called outside React, these tests exercise
 * the same logic the hook uses: construction, syncPropertySets,
 * add, remove, move, and ID stability.
 */

function createSets(count: number) {
    return Array.from({length: count}, () => new PropertyTree().getRoot());
}

function createManager(opts: {min?: number; max?: number; sets?: number} = {}) {
    const {min = 0, max = 0, sets = 0} = opts;
    const occurrences = Occurrences.minmax(min, max);
    const propertySets = createSets(sets);
    return {
        manager: new SetOccurrenceManager(occurrences, propertySets),
        occurrences,
        propertySets,
    };
}

describe('useSetOccurrenceManager — logic', () => {
    describe('initial state', () => {
        it('reflects PropertySet count and assigns IDs', () => {
            const {manager} = createManager({min: 0, max: 5, sets: 3});
            const state = manager.getState();

            expect(state.count).toBe(3);
            expect(state.ids).toHaveLength(3);
            expect(state.ids[0]).toMatch(/^set-occurrence-\d+$/);
            expect(state.ids[1]).toMatch(/^set-occurrence-\d+$/);
            expect(state.ids[2]).toMatch(/^set-occurrence-\d+$/);
        });

        it('reports canAdd/canRemove for empty 0:5', () => {
            const {manager} = createManager({min: 0, max: 5, sets: 0});
            const state = manager.getState();

            expect(state.count).toBe(0);
            expect(state.canAdd).toBe(true);
            // ? canRemove is false: 0 items, nothing to remove (0 > 0 is false)
            expect(state.canRemove).toBe(false);
        });

        it('reports isMinimumBreached when below minimum', () => {
            const {manager} = createManager({min: 2, max: 5, sets: 1});
            const state = manager.getState();

            expect(state.isMinimumBreached).toBe(true);
            expect(state.canRemove).toBe(false);
        });

        it('reports isMaximumBreached when above maximum', () => {
            const {manager} = createManager({min: 0, max: 2, sets: 3});
            const state = manager.getState();

            expect(state.isMaximumBreached).toBe(true);
            expect(state.canAdd).toBe(false);
        });
    });

    describe('add', () => {
        it('generates new ID and increments count', () => {
            const {manager} = createManager({min: 0, max: 5, sets: 1});
            const result = manager.add();

            expect(result).not.toBeNull();
            expect(result?.id).toMatch(/^set-occurrence-\d+$/);

            const state = manager.getState();
            expect(state.count).toBe(2);
            expect(state.ids).toHaveLength(2);
        });

        it('returns null when at maximum', () => {
            const {manager} = createManager({min: 0, max: 2, sets: 2});
            const result = manager.add();

            expect(result).toBeNull();
            expect(manager.getState().count).toBe(2);
        });

        it('allows adding when max is 0 (unlimited)', () => {
            const {manager} = createManager({min: 0, max: 0, sets: 10});
            const result = manager.add();

            expect(result).not.toBeNull();
            expect(manager.getState().count).toBe(11);
        });
    });

    describe('remove', () => {
        it('removes entry and decrements count', () => {
            const {manager} = createManager({min: 0, max: 5, sets: 3});
            const idsBefore = manager.getState().ids;

            const removed = manager.remove(1);

            expect(removed).toBe(true);
            const state = manager.getState();
            expect(state.count).toBe(2);
            expect(state.ids).toEqual([idsBefore[0], idsBefore[2]]);
        });

        it('returns false for out-of-bounds index', () => {
            const {manager} = createManager({min: 0, max: 5, sets: 2});

            expect(manager.remove(-1)).toBe(false);
            expect(manager.remove(2)).toBe(false);
            expect(manager.getState().count).toBe(2);
        });
    });

    describe('move', () => {
        it('reorders IDs correctly', () => {
            const {manager} = createManager({min: 0, max: 5, sets: 3});
            const idsBefore = manager.getState().ids;

            const moved = manager.move(0, 2);

            expect(moved).toBe(true);
            const state = manager.getState();
            expect(state.ids).toEqual([idsBefore[1], idsBefore[2], idsBefore[0]]);
        });

        it('returns false for same index', () => {
            const {manager} = createManager({min: 0, max: 5, sets: 3});

            expect(manager.move(1, 1)).toBe(false);
        });

        it('returns false for out-of-bounds indices', () => {
            const {manager} = createManager({min: 0, max: 5, sets: 2});

            expect(manager.move(-1, 0)).toBe(false);
            expect(manager.move(0, 2)).toBe(false);
        });
    });

    describe('syncPropertySets', () => {
        it('preserves IDs for unchanged PropertySet references', () => {
            const sets = createSets(3);
            const manager = new SetOccurrenceManager(Occurrences.minmax(0, 5), sets);
            const idsBefore = manager.getState().ids;

            // ? Same references in same order — IDs should be stable
            manager.syncPropertySets(sets);
            const idsAfter = manager.getState().ids;

            expect(idsAfter).toEqual(idsBefore);
        });

        it('assigns new IDs for new PropertySet references', () => {
            const sets = createSets(2);
            const manager = new SetOccurrenceManager(Occurrences.minmax(0, 5), sets);
            const idsBefore = manager.getState().ids;

            const newSets = [sets[0], new PropertyTree().getRoot()];
            manager.syncPropertySets(newSets);
            const idsAfter = manager.getState().ids;

            expect(idsAfter[0]).toBe(idsBefore[0]);
            expect(idsAfter[1]).not.toBe(idsBefore[1]);
        });

        it('updates count when sets grow', () => {
            const sets = createSets(2);
            const manager = new SetOccurrenceManager(Occurrences.minmax(0, 5), sets);

            manager.syncPropertySets([...sets, new PropertyTree().getRoot()]);
            expect(manager.getState().count).toBe(3);
        });

        it('updates count when sets shrink', () => {
            const sets = createSets(3);
            const manager = new SetOccurrenceManager(Occurrences.minmax(0, 5), sets);

            manager.syncPropertySets([sets[0]]);
            expect(manager.getState().count).toBe(1);
        });

        it('updates canAdd/canRemove after sync', () => {
            const sets = createSets(1);
            const manager = new SetOccurrenceManager(Occurrences.minmax(0, 2), sets);

            expect(manager.getState().canAdd).toBe(true);

            manager.syncPropertySets([...sets, new PropertyTree().getRoot()]);
            expect(manager.getState().canAdd).toBe(false);
        });
    });

    describe('ID stability', () => {
        it('IDs are unique across initial construction', () => {
            const {manager} = createManager({min: 0, max: 10, sets: 5});
            const ids = manager.getState().ids;
            const uniqueIds = new Set(ids);

            expect(uniqueIds.size).toBe(ids.length);
        });

        it('IDs remain stable across multiple getState calls', () => {
            const {manager} = createManager({min: 0, max: 5, sets: 3});
            const ids1 = manager.getState().ids;
            const ids2 = manager.getState().ids;

            expect(ids1).toEqual(ids2);
            // ? getState returns copies, not the same array reference
            expect(ids1).not.toBe(ids2);
        });

        it('added IDs are unique from existing ones', () => {
            const {manager} = createManager({min: 0, max: 5, sets: 2});
            const idsBefore = manager.getState().ids;

            manager.add();
            const idsAfter = manager.getState().ids;

            expect(idsAfter).toHaveLength(3);
            const uniqueIds = new Set(idsAfter);
            expect(uniqueIds.size).toBe(3);
            expect(idsAfter[0]).toBe(idsBefore[0]);
            expect(idsAfter[1]).toBe(idsBefore[1]);
        });
    });
});
