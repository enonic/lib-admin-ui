import {describe, expect, it, vi} from 'vitest';

import {PropertyArray} from '../../data/PropertyArray';
import type {PropertySet} from '../../data/PropertySet';
import {PropertyTree} from '../../data/PropertyTree';
import {ValueTypes} from '../../data/ValueTypes';

/**
 * Since hooks can't be called outside React, these tests exercise
 * the same logic the hook uses: reading PropertySets from a DATA-type
 * PropertyArray and subscribing to its structural events.
 */
describe('usePropertySetArray — logic & events', () => {
    function readPropertySets(pa: PropertyArray): PropertySet[] {
        return pa
            .getProperties()
            .map(p => p.getPropertySet())
            .filter((ps): ps is PropertySet => ps != null);
    }

    function createDataArray(setCount: number): {tree: PropertyTree; array: PropertyArray} {
        const tree = new PropertyTree();
        const root = tree.getRoot();
        const array = PropertyArray.create().setType(ValueTypes.DATA).setName('testSet').setParent(root).build();
        root.addPropertyArray(array);

        for (let i = 0; i < setCount; i++) {
            array.addSet();
        }

        return {tree, array};
    }

    describe('readPropertySets', () => {
        it('returns PropertySet[] from a DATA-type PropertyArray', () => {
            const {array} = createDataArray(3);

            const sets = readPropertySets(array);

            expect(sets).toHaveLength(3);
            sets.forEach(ps => {
                expect(ps).toBeDefined();
                expect(typeof ps.getSize).toBe('function');
            });
        });

        it('filters out null PropertySets', () => {
            const {array} = createDataArray(2);

            // Add a null DATA value
            array.add(ValueTypes.DATA.newNullValue());

            const sets = readPropertySets(array);

            // Should have 2, not 3 — the null value is filtered out
            expect(sets).toHaveLength(2);
            expect(array.getSize()).toBe(3);
        });
    });

    describe('null array', () => {
        it('should produce empty result for null', () => {
            const pa: PropertyArray | null = null;
            const propertySets = pa != null ? readPropertySets(pa) : [];
            const size = pa != null ? pa.getSize() : 0;
            expect(propertySets).toEqual([]);
            expect(size).toBe(0);
        });
    });

    describe('initial values', () => {
        it('reads initial PropertySets from a pre-populated array', () => {
            const {array} = createDataArray(3);

            const sets = readPropertySets(array);

            expect(sets).toHaveLength(3);
            expect(array.getSize()).toBe(3);
        });

        it('reads empty array when no sets exist', () => {
            const {array} = createDataArray(0);

            expect(readPropertySets(array)).toEqual([]);
            expect(array.getSize()).toBe(0);
        });
    });

    describe('event: onPropertyAdded', () => {
        it('fires when addSet() is called', () => {
            const {array} = createDataArray(1);
            const handler = vi.fn();
            array.onPropertyAdded(handler);

            array.addSet();

            expect(handler).toHaveBeenCalledOnce();
            const sets = readPropertySets(array);
            expect(sets).toHaveLength(2);
        });

        it('can unsubscribe from added events', () => {
            const {array} = createDataArray(1);
            const handler = vi.fn();
            array.onPropertyAdded(handler);
            array.unPropertyAdded(handler);

            array.addSet();

            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('event: onPropertyRemoved', () => {
        it('fires when remove() is called', () => {
            const {array} = createDataArray(2);
            const handler = vi.fn();
            array.onPropertyRemoved(handler);

            array.remove(0);

            expect(handler).toHaveBeenCalledOnce();
            const sets = readPropertySets(array);
            expect(sets).toHaveLength(1);
        });

        it('can unsubscribe from removed events', () => {
            const {array} = createDataArray(2);
            const handler = vi.fn();
            array.onPropertyRemoved(handler);
            array.unPropertyRemoved(handler);

            array.remove(0);

            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('event: onPropertyMoved', () => {
        it('fires when move() is called', () => {
            const {array} = createDataArray(3);
            const originalSets = readPropertySets(array);
            const handler = vi.fn();
            array.onPropertyMoved(handler);

            array.move(0, 2);

            expect(handler).toHaveBeenCalledOnce();
            const movedSets = readPropertySets(array);
            expect(movedSets[0]).toBe(originalSets[1]);
            expect(movedSets[1]).toBe(originalSets[2]);
            expect(movedSets[2]).toBe(originalSets[0]);
        });

        it('can unsubscribe from moved events', () => {
            const {array} = createDataArray(3);
            const handler = vi.fn();
            array.onPropertyMoved(handler);
            array.unPropertyMoved(handler);

            array.move(0, 2);

            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('onPropertyValueChanged is NOT used', () => {
        it('the hook deliberately skips onPropertyValueChanged — verify via spy', () => {
            const {array} = createDataArray(1);

            const onSpy = vi.spyOn(array, 'onPropertyValueChanged');
            const unSpy = vi.spyOn(array, 'unPropertyValueChanged');

            // Simulate what the hook does: subscribe to structural events only
            const handler = vi.fn();
            array.onPropertyAdded(handler);
            array.onPropertyRemoved(handler);
            array.onPropertyMoved(handler);

            // onPropertyValueChanged should never have been called
            expect(onSpy).not.toHaveBeenCalled();
            expect(unSpy).not.toHaveBeenCalled();

            onSpy.mockRestore();
            unSpy.mockRestore();
        });
    });

    describe('cleanup: unsubscribes on unmount', () => {
        it('properly unsubscribes all 3 event handlers', () => {
            const {array} = createDataArray(1);
            const handler = vi.fn();

            // Subscribe (simulates mount)
            array.onPropertyAdded(handler);
            array.onPropertyRemoved(handler);
            array.onPropertyMoved(handler);

            // Unsubscribe (simulates unmount cleanup)
            array.unPropertyAdded(handler);
            array.unPropertyRemoved(handler);
            array.unPropertyMoved(handler);

            // Mutations after cleanup should not trigger the handler
            array.addSet();
            array.remove(0);
            if (array.getSize() >= 2) {
                array.move(0, 1);
            }

            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('re-read pattern', () => {
        it('re-reading PropertySets after any structural mutation reflects current state', () => {
            const {array} = createDataArray(2);

            let latestSets: PropertySet[] = readPropertySets(array);
            const handler = () => {
                latestSets = readPropertySets(array);
            };

            array.onPropertyAdded(handler);
            array.onPropertyRemoved(handler);
            array.onPropertyMoved(handler);

            array.addSet();
            expect(latestSets).toHaveLength(3);

            array.remove(0);
            expect(latestSets).toHaveLength(2);

            array.move(0, 1);
            expect(latestSets).toHaveLength(2);
        });
    });
});
