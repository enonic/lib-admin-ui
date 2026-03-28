import {describe, expect, it} from 'vitest';
import {PropertyTree} from '../../data/PropertyTree';
import {Occurrences} from '../../form/Occurrences';
import {SetOccurrenceManager} from './SetOccurrenceManager';

function createPropertySet() {
    return new PropertyTree().getRoot();
}

function createManager(opts: {min?: number; max?: number; sets?: number} = {}) {
    const {min = 0, max = 0, sets = 0} = opts;
    const occurrences = Occurrences.minmax(min, max);
    const initialSets = Array.from({length: sets}, () => createPropertySet());
    return {manager: new SetOccurrenceManager(occurrences, initialSets), sets: initialSets};
}

describe('SetOccurrenceManager', () => {
    describe('constructor', () => {
        it('starts empty when no initial sets', () => {
            const {manager} = createManager();
            const state = manager.getState();
            expect(state.count).toBe(0);
            expect(state.ids).toEqual([]);
        });

        it('initializes with 1 PropertySet', () => {
            const {manager} = createManager({sets: 1});
            const state = manager.getState();
            expect(state.count).toBe(1);
            expect(state.ids).toHaveLength(1);
            expect(state.ids[0]).toBe('set-occurrence-0');
        });

        it('initializes with N PropertySets', () => {
            const {manager} = createManager({sets: 3});
            const state = manager.getState();
            expect(state.count).toBe(3);
            expect(state.ids).toEqual(['set-occurrence-0', 'set-occurrence-1', 'set-occurrence-2']);
        });
    });

    describe('add', () => {
        it('returns object with id', () => {
            const {manager} = createManager();
            const result = manager.add();
            expect(result).not.toBeNull();
            expect(result?.id).toBe('set-occurrence-0');
            expect(manager.getState().count).toBe(1);
        });

        it('returns null when at maximum', () => {
            const {manager} = createManager({max: 2, sets: 2});
            const result = manager.add();
            expect(result).toBeNull();
            expect(manager.getState().count).toBe(2);
        });

        it('allows unlimited adds when max is 0', () => {
            const {manager} = createManager({max: 0});
            for (let i = 0; i < 100; i++) {
                expect(manager.add()).not.toBeNull();
            }
            expect(manager.getState().count).toBe(100);
        });

        it('generates unique IDs for each add', () => {
            const {manager} = createManager();
            const id1 = manager.add()?.id;
            const id2 = manager.add()?.id;
            const id3 = manager.add()?.id;
            expect(id1).not.toBe(id2);
            expect(id2).not.toBe(id3);
        });
    });

    describe('remove', () => {
        it('removes at beginning', () => {
            const {manager} = createManager({sets: 3});
            const idsBefore = manager.getState().ids;
            manager.remove(0);
            const state = manager.getState();
            expect(state.count).toBe(2);
            expect(state.ids).toEqual([idsBefore[1], idsBefore[2]]);
        });

        it('removes at middle', () => {
            const {manager} = createManager({sets: 3});
            const idsBefore = manager.getState().ids;
            manager.remove(1);
            const state = manager.getState();
            expect(state.count).toBe(2);
            expect(state.ids).toEqual([idsBefore[0], idsBefore[2]]);
        });

        it('removes at end', () => {
            const {manager} = createManager({sets: 3});
            const idsBefore = manager.getState().ids;
            manager.remove(2);
            const state = manager.getState();
            expect(state.count).toBe(2);
            expect(state.ids).toEqual([idsBefore[0], idsBefore[1]]);
        });

        it('returns false for out-of-bounds positive index', () => {
            const {manager} = createManager({sets: 2});
            expect(manager.remove(5)).toBe(false);
            expect(manager.getState().count).toBe(2);
        });

        it('returns false for negative index', () => {
            const {manager} = createManager({sets: 2});
            expect(manager.remove(-1)).toBe(false);
            expect(manager.getState().count).toBe(2);
        });

        it('handles single-element removal', () => {
            const {manager} = createManager({sets: 1});
            expect(manager.remove(0)).toBe(true);
            expect(manager.getState().count).toBe(0);
        });
    });

    describe('move', () => {
        it('reorders IDs forward', () => {
            const {manager} = createManager({sets: 3});
            const idsBefore = manager.getState().ids;
            manager.move(0, 2);
            expect(manager.getState().ids).toEqual([idsBefore[1], idsBefore[2], idsBefore[0]]);
        });

        it('reorders IDs backward', () => {
            const {manager} = createManager({sets: 3});
            const idsBefore = manager.getState().ids;
            manager.move(2, 0);
            expect(manager.getState().ids).toEqual([idsBefore[2], idsBefore[0], idsBefore[1]]);
        });

        it('returns false for same index', () => {
            const {manager} = createManager({sets: 3});
            const idsBefore = manager.getState().ids;
            expect(manager.move(1, 1)).toBe(false);
            expect(manager.getState().ids).toEqual(idsBefore);
        });

        it('returns false for out-of-bounds', () => {
            const {manager} = createManager({sets: 2});
            const idsBefore = manager.getState().ids;
            expect(manager.move(0, 5)).toBe(false);
            expect(manager.getState().ids).toEqual(idsBefore);
        });

        it('returns false for negative index', () => {
            const {manager} = createManager({sets: 2});
            expect(manager.move(-1, 0)).toBe(false);
        });
    });

    describe('syncPropertySets', () => {
        it('preserves IDs for unchanged references', () => {
            const sets = [createPropertySet(), createPropertySet(), createPropertySet()];
            const manager = new SetOccurrenceManager(Occurrences.minmax(0, 0), sets);
            const idsBefore = manager.getState().ids;

            manager.syncPropertySets(sets);
            expect(manager.getState().ids).toEqual(idsBefore);
        });

        it('generates new IDs when references change', () => {
            const sets = [createPropertySet(), createPropertySet()];
            const manager = new SetOccurrenceManager(Occurrences.minmax(0, 0), sets);
            const idsBefore = manager.getState().ids;

            const newSets = [createPropertySet(), createPropertySet()];
            manager.syncPropertySets(newSets);
            const idsAfter = manager.getState().ids;

            expect(idsAfter[0]).not.toBe(idsBefore[0]);
            expect(idsAfter[1]).not.toBe(idsBefore[1]);
        });

        it('handles mid-array removal (reference at old index changes)', () => {
            const sets = [createPropertySet(), createPropertySet(), createPropertySet()];
            const manager = new SetOccurrenceManager(Occurrences.minmax(0, 0), sets);
            const idsBefore = manager.getState().ids;

            // ? Remove middle element — sets[2] now occupies index 1
            manager.syncPropertySets([sets[0], sets[2]]);
            const idsAfter = manager.getState().ids;

            expect(idsAfter).toHaveLength(2);
            expect(idsAfter[0]).toBe(idsBefore[0]);
            // ? sets[2] was at index 2 but is now at index 1 — reference differs from old index 1
            expect(idsAfter[1]).not.toBe(idsBefore[1]);
        });

        it('handles append (new entries get new IDs)', () => {
            const sets = [createPropertySet()];
            const manager = new SetOccurrenceManager(Occurrences.minmax(0, 0), sets);
            const idsBefore = manager.getState().ids;

            const appended = [...sets, createPropertySet()];
            manager.syncPropertySets(appended);
            const idsAfter = manager.getState().ids;

            expect(idsAfter).toHaveLength(2);
            expect(idsAfter[0]).toBe(idsBefore[0]);
            expect(idsAfter[1]).toMatch(/^set-occurrence-\d+$/);
        });

        it('handles empty to non-empty sync', () => {
            const manager = new SetOccurrenceManager(Occurrences.minmax(0, 0), []);
            expect(manager.getState().count).toBe(0);

            manager.syncPropertySets([createPropertySet(), createPropertySet()]);
            expect(manager.getState().count).toBe(2);
        });

        it('handles non-empty to empty sync', () => {
            const sets = [createPropertySet(), createPropertySet()];
            const manager = new SetOccurrenceManager(Occurrences.minmax(0, 0), sets);
            expect(manager.getState().count).toBe(2);

            manager.syncPropertySets([]);
            expect(manager.getState().count).toBe(0);
            expect(manager.getState().ids).toEqual([]);
        });
    });

    describe('canAdd / canRemove', () => {
        it('canAdd returns true when below maximum', () => {
            const {manager} = createManager({max: 3, sets: 1});
            expect(manager.getState().canAdd).toBe(true);
        });

        it('canAdd returns false when at maximum', () => {
            const {manager} = createManager({max: 2, sets: 2});
            expect(manager.getState().canAdd).toBe(false);
        });

        it('canAdd returns true when max is 0 (unlimited)', () => {
            const {manager} = createManager({max: 0, sets: 5});
            expect(manager.getState().canAdd).toBe(true);
        });

        it('canRemove returns true when above minimum', () => {
            const {manager} = createManager({min: 1, sets: 2});
            expect(manager.getState().canRemove).toBe(true);
        });

        it('canRemove returns false when at minimum', () => {
            const {manager} = createManager({min: 2, sets: 2});
            expect(manager.getState().canRemove).toBe(false);
        });

        it('canRemove returns true when no minimum set', () => {
            const {manager} = createManager({min: 0, sets: 1});
            expect(manager.getState().canRemove).toBe(true);
        });
    });

    describe('getState', () => {
        it('returns correct state for empty manager', () => {
            const {manager} = createManager({min: 0, max: 0});
            const state = manager.getState();
            expect(state).toEqual({
                ids: [],
                count: 0,
                isMinimumBreached: false,
                isMaximumBreached: false,
                canAdd: true,
                canRemove: false,
            });
        });

        it('returns correct state with minimum breach', () => {
            const {manager} = createManager({min: 3, sets: 1});
            const state = manager.getState();
            expect(state.count).toBe(1);
            expect(state.isMinimumBreached).toBe(true);
            expect(state.isMaximumBreached).toBe(false);
        });

        it('returns correct state with maximum breach', () => {
            // ? Sync more sets than max allows to trigger breach
            const sets = [createPropertySet(), createPropertySet(), createPropertySet()];
            const manager = new SetOccurrenceManager(Occurrences.minmax(0, 2), sets);
            const state = manager.getState();
            expect(state.count).toBe(3);
            expect(state.isMaximumBreached).toBe(true);
        });

        it('returns snapshot (mutations do not affect returned state)', () => {
            const {manager} = createManager({sets: 2});
            const state = manager.getState();
            manager.remove(0);
            expect(state.count).toBe(2);
            expect(state.ids).toHaveLength(2);
        });
    });

    describe('getId', () => {
        it('returns ID at valid index', () => {
            const {manager} = createManager({sets: 2});
            expect(manager.getId(0)).toBe('set-occurrence-0');
            expect(manager.getId(1)).toBe('set-occurrence-1');
        });

        it('returns undefined for out-of-bounds index', () => {
            const {manager} = createManager({sets: 1});
            expect(manager.getId(5)).toBeUndefined();
        });

        it('returns undefined for negative index', () => {
            const {manager} = createManager({sets: 1});
            expect(manager.getId(-1)).toBeUndefined();
        });
    });

    describe('unlimited max (max=0)', () => {
        it('never reports maximum breached', () => {
            const sets = Array.from({length: 50}, () => createPropertySet());
            const manager = new SetOccurrenceManager(Occurrences.minmax(0, 0), sets);
            const state = manager.getState();
            expect(state.isMaximumBreached).toBe(false);
            expect(state.canAdd).toBe(true);
        });

        it('allows unlimited adds', () => {
            const {manager} = createManager({max: 0});
            for (let i = 0; i < 50; i++) {
                expect(manager.add()).not.toBeNull();
            }
            expect(manager.getState().count).toBe(50);
        });
    });
});
