import {describe, expect, it, vi} from 'vitest';
import {ValueTypes} from '../../main/resources/assets/admin/common/js/data/ValueTypes';
import type {TextLineConfig} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/InputTypeConfig';
import {OccurrenceManager} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/OccurrenceManager';
import {TextLineDescriptor} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/TextLineDescriptor';
import {Occurrences} from '../../main/resources/assets/admin/common/js/form/Occurrences';

vi.mock('../../main/resources/assets/admin/common/js/util/Messages', () => ({
    i18n: (key: string, ..._args: unknown[]) => `#${key}#`,
}));

function createManager(opts: {min?: number; max?: number; values?: string[]} = {}) {
    const {min = 0, max = 0, values = []} = opts;
    const occurrences = Occurrences.minmax(min, max);
    const config = TextLineDescriptor.readConfig({});
    const initialValues = values.map(v => ValueTypes.STRING.newValue(v));
    return new OccurrenceManager<TextLineConfig>(occurrences, TextLineDescriptor, config, initialValues);
}

describe('OccurrenceManager', () => {
    describe('add + validate', () => {
        it('should update state after adding an occurrence', () => {
            // Arrange
            const manager = createManager({min: 0, max: 3, values: ['a']});

            // Act
            manager.add(ValueTypes.STRING.newValue('b'));
            const state = manager.validate();

            // Assert
            expect(state.values).toHaveLength(2);
            expect(state.values[1].getString()).toBe('b');
            expect(state.canAdd).toBe(true);
        });

        it('should reflect canAdd=false when maximum reached after add', () => {
            // Arrange
            const manager = createManager({min: 0, max: 2, values: ['a']});

            // Act
            manager.add(ValueTypes.STRING.newValue('b'));
            const state = manager.validate();

            // Assert
            expect(state.values).toHaveLength(2);
            expect(state.canAdd).toBe(false);
        });
    });

    describe('remove + validate', () => {
        it('should update state after removing an occurrence', () => {
            // Arrange
            const manager = createManager({min: 0, max: 3, values: ['a', 'b', 'c']});

            // Act
            manager.remove(1);
            const state = manager.validate();

            // Assert
            expect(state.values).toHaveLength(2);
            expect(state.values[0].getString()).toBe('a');
            expect(state.values[1].getString()).toBe('c');
        });

        it('should reflect canRemove=false when at minimum after remove', () => {
            // Arrange
            const manager = createManager({min: 1, max: 3, values: ['a', 'b']});

            // Act
            manager.remove(0);
            const state = manager.validate();

            // Assert
            expect(state.values).toHaveLength(1);
            expect(state.canRemove).toBe(false);
        });
    });

    describe('move + validate', () => {
        it('should reorder values after move', () => {
            // Arrange
            const manager = createManager({min: 0, max: 0, values: ['a', 'b', 'c']});

            // Act
            manager.move(0, 2);
            const state = manager.validate();

            // Assert
            expect(state.values.map(v => v.getString())).toEqual(['b', 'c', 'a']);
        });

        it('should preserve validation state after move', () => {
            // Arrange
            const manager = createManager({min: 1, max: 0, values: ['a', 'b']});

            // Act
            manager.move(1, 0);
            const state = manager.validate();

            // Assert
            expect(state.isValid).toBe(true);
            expect(state.values[0].getString()).toBe('b');
            expect(state.values[1].getString()).toBe('a');
        });
    });

    describe('set + validate', () => {
        it('should replace value at index', () => {
            // Arrange
            const manager = createManager({min: 0, max: 3, values: ['a', 'b']});

            // Act
            manager.set(0, ValueTypes.STRING.newValue('x'));
            const state = manager.validate();

            // Assert
            expect(state.values[0].getString()).toBe('x');
            expect(state.values[1].getString()).toBe('b');
        });

        it('should update validation after set', () => {
            // Arrange
            const occurrences = Occurrences.minmax(1, 3);
            const config: TextLineConfig = {regexp: /^[A-Z]/, maxLength: -1, showCounter: false};
            const values = [ValueTypes.STRING.newValue('bad')];
            const manager = new OccurrenceManager<TextLineConfig>(occurrences, TextLineDescriptor, config, values);

            // Act — fix the invalid value
            manager.set(0, ValueTypes.STRING.newValue('Good'));
            const state = manager.validate();

            // Assert
            expect(state.isValid).toBe(true);
            expect(state.occurrenceValidation[0].validationResults).toHaveLength(0);
        });
    });

    describe('ids', () => {
        it('should generate unique IDs for initial values', () => {
            // Arrange + Act
            const manager = createManager({values: ['a', 'b', 'c']});
            const state = manager.validate();

            // Assert
            expect(state.ids).toHaveLength(3);
            expect(new Set(state.ids).size).toBe(3);
        });

        it('should assign new ID on add and preserve existing IDs', () => {
            // Arrange
            const manager = createManager({max: 5, values: ['a', 'b']});
            const before = manager.validate().ids;

            // Act
            manager.add(ValueTypes.STRING.newValue('c'));
            const after = manager.validate().ids;

            // Assert
            expect(after).toHaveLength(3);
            expect(after[0]).toBe(before[0]);
            expect(after[1]).toBe(before[1]);
            expect(after[2]).not.toBe(before[0]);
            expect(after[2]).not.toBe(before[1]);
        });

        it('should remove correct ID on remove', () => {
            // Arrange
            const manager = createManager({values: ['a', 'b', 'c']});
            const before = manager.validate().ids;

            // Act
            manager.remove(1);
            const after = manager.validate().ids;

            // Assert
            expect(after).toEqual([before[0], before[2]]);
        });

        it('should reorder IDs on move', () => {
            // Arrange
            const manager = createManager({values: ['a', 'b', 'c']});
            const before = manager.validate().ids;

            // Act
            manager.move(0, 2);
            const after = manager.validate().ids;

            // Assert
            expect(after).toEqual([before[1], before[2], before[0]]);
        });

        it('should preserve IDs on set', () => {
            // Arrange
            const manager = createManager({max: 5, values: ['a', 'b']});
            const before = manager.validate().ids;

            // Act
            manager.set(0, ValueTypes.STRING.newValue('x'));
            const after = manager.validate().ids;

            // Assert
            expect(after).toEqual(before);
        });

        it('should preserve existing IDs and generate new ones for added positions on setValues', () => {
            // Arrange
            const manager = createManager({values: ['a', 'b']});
            const before = manager.validate().ids;

            // Act — same length: IDs preserved
            manager.setValues([ValueTypes.STRING.newValue('x'), ValueTypes.STRING.newValue('y')]);
            const sameLengthIds = manager.validate().ids;

            // Assert
            expect(sameLengthIds).toHaveLength(2);
            expect(sameLengthIds[0]).toBe(before[0]);
            expect(sameLengthIds[1]).toBe(before[1]);

            // Act — grow: existing preserved, new one generated
            manager.setValues([
                ValueTypes.STRING.newValue('x'),
                ValueTypes.STRING.newValue('y'),
                ValueTypes.STRING.newValue('z'),
            ]);
            const grownIds = manager.validate().ids;

            // Assert
            expect(grownIds).toHaveLength(3);
            expect(grownIds[0]).toBe(before[0]);
            expect(grownIds[1]).toBe(before[1]);
            expect(grownIds[2]).not.toBe(before[0]);
            expect(grownIds[2]).not.toBe(before[1]);

            // Act — shrink: only kept positions preserved
            manager.setValues([ValueTypes.STRING.newValue('only')]);
            const shrunkIds = manager.validate().ids;

            // Assert
            expect(shrunkIds).toHaveLength(1);
            expect(shrunkIds[0]).toBe(before[0]);
        });
    });

    describe('full lifecycle', () => {
        it('should handle add -> set -> move -> remove with correct constraints', () => {
            // Arrange
            const manager = createManager({min: 1, max: 4, values: ['first']});

            // Act: add
            manager.add(ValueTypes.STRING.newValue('second'));
            manager.add(ValueTypes.STRING.newValue('third'));
            let state = manager.validate();

            // Assert: after adds
            expect(state.values).toHaveLength(3);
            expect(state.canAdd).toBe(true);
            expect(state.canRemove).toBe(true);

            // Act: set
            manager.set(1, ValueTypes.STRING.newValue('updated'));
            state = manager.validate();
            expect(state.values[1].getString()).toBe('updated');

            // Act: move
            manager.move(2, 0);
            state = manager.validate();
            expect(state.values.map(v => v.getString())).toEqual(['third', 'first', 'updated']);

            // Act: remove until at minimum
            manager.remove(2);
            manager.remove(1);
            state = manager.validate();

            // Assert: at minimum
            expect(state.values).toHaveLength(1);
            expect(state.canRemove).toBe(false);
            expect(state.canAdd).toBe(true);
        });

        it('should respect min/max constraints across transitions', () => {
            // Arrange
            const manager = createManager({min: 2, max: 4, values: ['a', 'b']});

            // Assert: initial state
            let state = manager.validate();
            expect(state.canRemove).toBe(false);
            expect(state.canAdd).toBe(true);

            // Act: add to max
            manager.add(ValueTypes.STRING.newValue('c'));
            manager.add(ValueTypes.STRING.newValue('d'));
            state = manager.validate();
            expect(state.canAdd).toBe(false);
            expect(state.canRemove).toBe(true);

            // Act: try to add beyond max
            manager.add(ValueTypes.STRING.newValue('e'));
            state = manager.validate();
            expect(state.values).toHaveLength(4);

            // Act: remove back to min
            manager.remove(3);
            manager.remove(2);
            state = manager.validate();
            expect(state.values).toHaveLength(2);
            expect(state.canRemove).toBe(false);
        });
    });
});
