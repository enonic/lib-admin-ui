import {describe, expect, it, vi} from 'vitest';

import type {PropertyArray} from '../../data/PropertyArray';
import {PropertyTree} from '../../data/PropertyTree';
import type {Value} from '../../data/Value';
import {ValueTypes} from '../../data/ValueTypes';

/**
 * Since hooks can't be called outside React, these tests exercise
 * the same logic the hook uses: reading values from PropertyArray
 * and subscribing to its events.
 */
describe('usePropertyArray — logic & events', () => {
    function readValues(pa: PropertyArray): Value[] {
        return pa.getProperties().map(p => p.getValue());
    }

    function createArrayWithStrings(...values: string[]): {tree: PropertyTree; array: PropertyArray} {
        const tree = new PropertyTree();
        for (const v of values) {
            tree.addString('field', v);
        }
        const array = tree.getRoot().getPropertyArray('field');
        return {tree, array};
    }

    describe('null array', () => {
        it('should produce empty result for null', () => {
            const pa: PropertyArray | null = null;
            const values = pa != null ? readValues(pa) : [];
            const size = pa != null ? pa.getSize() : 0;
            expect(values).toEqual([]);
            expect(size).toBe(0);
        });
    });

    describe('initial values', () => {
        it('reads initial values from a pre-populated array', () => {
            const {array} = createArrayWithStrings('a', 'b', 'c');

            const values = readValues(array);

            expect(values).toHaveLength(3);
            expect(values[0].getString()).toBe('a');
            expect(values[1].getString()).toBe('b');
            expect(values[2].getString()).toBe('c');
            expect(array.getSize()).toBe(3);
        });

        it('reads empty array when no values exist', () => {
            const tree = new PropertyTree();
            // Adding and removing creates the array
            tree.addString('field', 'temp');
            const array = tree.getRoot().getPropertyArray('field');
            array.remove(0);

            expect(readValues(array)).toEqual([]);
            expect(array.getSize()).toBe(0);
        });
    });

    describe('event: onPropertyAdded', () => {
        it('fires when add() is called', () => {
            const {array} = createArrayWithStrings('initial');
            const handler = vi.fn();
            array.onPropertyAdded(handler);

            array.add(ValueTypes.STRING.newValue('added'));

            expect(handler).toHaveBeenCalledOnce();
            const values = readValues(array);
            expect(values).toHaveLength(2);
            expect(values[1].getString()).toBe('added');
        });

        it('can unsubscribe from added events', () => {
            const {array} = createArrayWithStrings('initial');
            const handler = vi.fn();
            array.onPropertyAdded(handler);
            array.unPropertyAdded(handler);

            array.add(ValueTypes.STRING.newValue('added'));

            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('event: onPropertyRemoved', () => {
        it('fires when remove() is called', () => {
            const {array} = createArrayWithStrings('a', 'b');
            const handler = vi.fn();
            array.onPropertyRemoved(handler);

            array.remove(0);

            expect(handler).toHaveBeenCalledOnce();
            const values = readValues(array);
            expect(values).toHaveLength(1);
            expect(values[0].getString()).toBe('b');
        });

        it('can unsubscribe from removed events', () => {
            const {array} = createArrayWithStrings('a', 'b');
            const handler = vi.fn();
            array.onPropertyRemoved(handler);
            array.unPropertyRemoved(handler);

            array.remove(0);

            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('event: onPropertyValueChanged', () => {
        it('fires when set() updates an existing value', () => {
            const {array} = createArrayWithStrings('original');
            const handler = vi.fn();
            array.onPropertyValueChanged(handler);

            array.set(0, ValueTypes.STRING.newValue('updated'));

            expect(handler).toHaveBeenCalledOnce();
            expect(readValues(array)[0].getString()).toBe('updated');
        });

        it('fires when property setValue() is called directly', () => {
            const {array} = createArrayWithStrings('original');
            const handler = vi.fn();
            array.onPropertyValueChanged(handler);

            array.get(0).setValue(ValueTypes.STRING.newValue('changed'));

            expect(handler).toHaveBeenCalledOnce();
            expect(readValues(array)[0].getString()).toBe('changed');
        });

        it('can unsubscribe from value changed events', () => {
            const {array} = createArrayWithStrings('original');
            const handler = vi.fn();
            array.onPropertyValueChanged(handler);
            array.unPropertyValueChanged(handler);

            array.set(0, ValueTypes.STRING.newValue('updated'));

            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('event: onPropertyMoved', () => {
        it('fires when move() is called', () => {
            const {array} = createArrayWithStrings('a', 'b', 'c');
            const handler = vi.fn();
            array.onPropertyMoved(handler);

            array.move(0, 2);

            expect(handler).toHaveBeenCalledOnce();
            const values = readValues(array);
            expect(values[0].getString()).toBe('b');
            expect(values[1].getString()).toBe('c');
            expect(values[2].getString()).toBe('a');
        });

        it('can unsubscribe from moved events', () => {
            const {array} = createArrayWithStrings('a', 'b', 'c');
            const handler = vi.fn();
            array.onPropertyMoved(handler);
            array.unPropertyMoved(handler);

            array.move(0, 2);

            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('re-read pattern', () => {
        it('re-reading values after any mutation reflects current state', () => {
            const {array} = createArrayWithStrings('a', 'b');

            // Simulate the hook handler: re-read all on every event
            let latestValues: Value[] = readValues(array);
            const handler = () => {
                latestValues = readValues(array);
            };

            array.onPropertyAdded(handler);
            array.onPropertyRemoved(handler);
            array.onPropertyValueChanged(handler);
            array.onPropertyMoved(handler);

            array.add(ValueTypes.STRING.newValue('c'));
            expect(latestValues.map(v => v.getString())).toEqual(['a', 'b', 'c']);

            array.remove(1);
            expect(latestValues.map(v => v.getString())).toEqual(['a', 'c']);

            array.set(0, ValueTypes.STRING.newValue('x'));
            expect(latestValues.map(v => v.getString())).toEqual(['x', 'c']);

            array.move(0, 1);
            expect(latestValues.map(v => v.getString())).toEqual(['c', 'x']);
        });
    });
});
