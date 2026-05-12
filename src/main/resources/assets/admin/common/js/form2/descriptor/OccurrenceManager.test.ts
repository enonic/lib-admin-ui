import {describe, expect, it, vi} from 'vitest';
import {ValueTypes} from '../../data/ValueTypes';
import {Occurrences} from '../../form/Occurrences';
import {CheckboxDescriptor} from './CheckboxDescriptor';
import {DoubleDescriptor} from './DoubleDescriptor';
import type {CheckboxConfig, NumberConfig, TextLineConfig} from './InputTypeConfig';
import {OccurrenceManager} from './OccurrenceManager';
import {TextLineDescriptor} from './TextLineDescriptor';

vi.mock('../../util/Messages', () => ({
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
    describe('constructor', () => {
        it('initializes with given values', () => {
            const mgr = createManager({values: ['a', 'b']});
            expect(mgr.getCount()).toBe(2);
            expect(mgr.getValues()[0].getString()).toBe('a');
            expect(mgr.getValues()[1].getString()).toBe('b');
        });

        it('starts empty when no initial values', () => {
            const mgr = createManager();
            expect(mgr.getCount()).toBe(0);
            expect(mgr.getValues()).toEqual([]);
        });
    });

    describe('add', () => {
        it('appends null value when no value given', () => {
            const mgr = createManager();
            mgr.add();
            expect(mgr.getCount()).toBe(1);
            expect(mgr.getValues()[0].isNull()).toBe(true);
        });

        it('appends given value', () => {
            const mgr = createManager();
            mgr.add(ValueTypes.STRING.newValue('test'));
            expect(mgr.getCount()).toBe(1);
            expect(mgr.getValues()[0].getString()).toBe('test');
        });

        it('respects maximum limit', () => {
            const mgr = createManager({max: 2, values: ['a', 'b']});
            mgr.add(ValueTypes.STRING.newValue('c'));
            expect(mgr.getCount()).toBe(2);
        });

        it('allows unlimited adds when max is 0', () => {
            const mgr = createManager({max: 0});
            for (let i = 0; i < 100; i++) {
                mgr.add(ValueTypes.STRING.newValue(`v${i}`));
            }
            expect(mgr.getCount()).toBe(100);
        });
    });

    describe('remove', () => {
        it('removes value at index', () => {
            const mgr = createManager({values: ['a', 'b', 'c']});
            mgr.remove(1);
            expect(mgr.getCount()).toBe(2);
            expect(mgr.getValues()[0].getString()).toBe('a');
            expect(mgr.getValues()[1].getString()).toBe('c');
        });

        it('does nothing for out-of-bounds index', () => {
            const mgr = createManager({values: ['a']});
            mgr.remove(5);
            expect(mgr.getCount()).toBe(1);
        });

        it('does nothing for negative index', () => {
            const mgr = createManager({values: ['a']});
            mgr.remove(-1);
            expect(mgr.getCount()).toBe(1);
        });

        it('handles single-element removal', () => {
            const mgr = createManager({values: ['a']});
            mgr.remove(0);
            expect(mgr.getCount()).toBe(0);
        });
    });

    describe('move', () => {
        it('reorders values forward', () => {
            const mgr = createManager({values: ['a', 'b', 'c']});
            mgr.move(0, 2);
            expect(mgr.getValues().map(v => v.getString())).toEqual(['b', 'c', 'a']);
        });

        it('reorders values backward', () => {
            const mgr = createManager({values: ['a', 'b', 'c']});
            mgr.move(2, 0);
            expect(mgr.getValues().map(v => v.getString())).toEqual(['c', 'a', 'b']);
        });

        it('does nothing for same index', () => {
            const mgr = createManager({values: ['a', 'b']});
            mgr.move(0, 0);
            expect(mgr.getValues().map(v => v.getString())).toEqual(['a', 'b']);
        });

        it('does nothing for out-of-bounds', () => {
            const mgr = createManager({values: ['a', 'b']});
            mgr.move(0, 5);
            expect(mgr.getValues().map(v => v.getString())).toEqual(['a', 'b']);
        });
    });

    describe('set', () => {
        it('replaces value at index', () => {
            const mgr = createManager({values: ['a', 'b']});
            mgr.set(0, ValueTypes.STRING.newValue('x'));
            expect(mgr.getValues()[0].getString()).toBe('x');
        });

        it('does nothing for out-of-bounds', () => {
            const mgr = createManager({values: ['a']});
            mgr.set(5, ValueTypes.STRING.newValue('x'));
            expect(mgr.getCount()).toBe(1);
            expect(mgr.getValues()[0].getString()).toBe('a');
        });
    });

    describe('canAdd / canRemove', () => {
        it('canAdd returns true when below maximum', () => {
            const mgr = createManager({max: 3, values: ['a']});
            expect(mgr.canAdd()).toBe(true);
        });

        it('canAdd returns false when at maximum', () => {
            const mgr = createManager({max: 2, values: ['a', 'b']});
            expect(mgr.canAdd()).toBe(false);
        });

        it('canAdd returns true when max is 0 (unlimited)', () => {
            const mgr = createManager({max: 0, values: ['a', 'b', 'c']});
            expect(mgr.canAdd()).toBe(true);
        });

        it('canRemove returns true when above minimum', () => {
            const mgr = createManager({min: 1, values: ['a', 'b']});
            expect(mgr.canRemove()).toBe(true);
        });

        it('canRemove returns false when at minimum', () => {
            const mgr = createManager({min: 2, values: ['a', 'b']});
            expect(mgr.canRemove()).toBe(false);
        });

        it('canRemove returns true when no minimum set', () => {
            const mgr = createManager({min: 0, values: ['a']});
            expect(mgr.canRemove()).toBe(true);
        });
    });

    describe('validate', () => {
        it('counts valid occurrences correctly', () => {
            const mgr = createManager({min: 1, values: ['hello', 'world']});
            const state = mgr.validate();
            expect(state.totalValid).toBe(2);
        });

        it('detects minimum breach', () => {
            const mgr = createManager({min: 3, values: ['a']});
            const state = mgr.validate();
            expect(state.isMinimumBreached).toBe(true);
        });

        it('detects maximum breach', () => {
            // Manually set more values than max allows for validation purposes
            const occurrences = Occurrences.minmax(0, 2);
            const config = TextLineDescriptor.readConfig({});
            const values = ['a', 'b', 'c'].map(v => ValueTypes.STRING.newValue(v));
            const mgr = new OccurrenceManager<TextLineConfig>(occurrences, TextLineDescriptor, config, values);
            const state = mgr.validate();
            expect(state.isMaximumBreached).toBe(true);
        });

        it('per-occurrence validation results from descriptor', () => {
            const occurrences = Occurrences.minmax(0, 0);
            const config: TextLineConfig = {regexp: /^[0-9]+$/, maxLength: -1, showCounter: false};
            const values = [ValueTypes.STRING.newValue('123'), ValueTypes.STRING.newValue('abc')];
            const mgr = new OccurrenceManager<TextLineConfig>(occurrences, TextLineDescriptor, config, values);
            const state = mgr.validate();

            expect(state.occurrenceValidation[0].validationResults).toHaveLength(0);
            expect(state.occurrenceValidation[1].validationResults).toHaveLength(1);
        });

        it('isValid reflects combined state', () => {
            const mgr = createManager({min: 1, values: ['hello']});
            const state = mgr.validate();
            expect(state.isValid).toBe(true);
        });

        it('isValid is false when minimum breached', () => {
            const mgr = createManager({min: 2, values: ['hello']});
            const state = mgr.validate();
            expect(state.isValid).toBe(false);
        });

        it('handles empty values array', () => {
            const mgr = createManager({min: 0});
            const state = mgr.validate();
            expect(state.totalValid).toBe(0);
            expect(state.isMinimumBreached).toBe(false);
            expect(state.isValid).toBe(true);
            expect(state.occurrenceValidation).toEqual([]);
        });

        it('breaksRequired is true for null values', () => {
            const mgr = createManager();
            mgr.add(); // adds null value
            const state = mgr.validate();
            expect(state.occurrenceValidation[0].breaksRequired).toBe(true);
            expect(state.totalValid).toBe(0);
        });
    });

    describe('transient errors', () => {
        it('folds a transient error into the occurrence with the matching ID', () => {
            const mgr = createManager({values: ['a', 'b']});
            const ids = mgr.getIds();
            mgr.setTransientError(ids[1], 'Translation failed');
            const state = mgr.validate();

            expect(state.occurrenceValidation[0].validationResults).toHaveLength(0);
            expect(state.occurrenceValidation[1].validationResults).toEqual([
                {message: 'Translation failed', transient: true},
            ]);
        });

        it('prepends transient before descriptor errors so it appears first', () => {
            const occurrences = Occurrences.minmax(0, 0);
            const config: TextLineConfig = {regexp: /^[0-9]+$/, maxLength: -1, showCounter: false};
            const values = [ValueTypes.STRING.newValue('abc')];
            const mgr = new OccurrenceManager<TextLineConfig>(occurrences, TextLineDescriptor, config, values);
            const [id] = mgr.getIds();
            mgr.setTransientError(id, 'Translation failed');
            const state = mgr.validate();

            expect(state.occurrenceValidation[0].validationResults[0]).toEqual({
                message: 'Translation failed',
                transient: true,
            });
            expect(state.occurrenceValidation[0].validationResults.length).toBeGreaterThan(1);
        });

        it('rejects setTransientError for unknown IDs (e.g. stale ID captured before removal)', () => {
            const mgr = createManager({values: ['a']});
            expect(mgr.setTransientError('occurrence-does-not-exist', 'x')).toBe(false);
            expect(mgr.validate().occurrenceValidation[0].validationResults).toHaveLength(0);
        });

        it('rejects setTransientError after the captured occurrence has been removed', () => {
            const mgr = createManager({values: ['a', 'b']});
            const removedId = mgr.getIds()[1];

            mgr.remove(1);

            // ? Simulates an async caller that captured the ID before remove() landed.
            expect(mgr.setTransientError(removedId, 'late')).toBe(false);
            expect(mgr.hasTransientErrors()).toBe(false);
        });

        it('counts transient errors as field errors for totalValid', () => {
            const mgr = createManager({min: 1, values: ['hello']});
            const [id] = mgr.getIds();
            mgr.setTransientError(id, 'Translation failed');
            const state = mgr.validate();

            expect(state.totalValid).toBe(0);
            expect(state.isValid).toBe(false);
            expect(state.isMinimumBreached).toBe(true);
        });

        it('clears transient on set() (user edit) for the matching ID', () => {
            const mgr = createManager({values: ['a', 'b']});
            const [idA, idB] = mgr.getIds();
            mgr.setTransientError(idA, 'Translation failed');
            mgr.setTransientError(idB, 'Other');

            mgr.set(0, ValueTypes.STRING.newValue('a2'));
            const state = mgr.validate();

            expect(state.occurrenceValidation[0].validationResults).toHaveLength(0);
            expect(state.occurrenceValidation[1].validationResults).toEqual([{message: 'Other', transient: true}]);
        });

        it('clears all transient on setValues (sync)', () => {
            const mgr = createManager({values: ['a', 'b']});
            const [idA, idB] = mgr.getIds();
            mgr.setTransientError(idA, 'One');
            mgr.setTransientError(idB, 'Two');

            mgr.setValues([ValueTypes.STRING.newValue('x'), ValueTypes.STRING.newValue('y')]);
            const state = mgr.validate();

            expect(state.occurrenceValidation[0].validationResults).toHaveLength(0);
            expect(state.occurrenceValidation[1].validationResults).toHaveLength(0);
            expect(mgr.hasTransientErrors()).toBe(false);
        });

        it('preserves transient errors on add() (existing IDs untouched)', () => {
            const mgr = createManager({values: ['a']});
            const [idA] = mgr.getIds();
            mgr.setTransientError(idA, 'One');
            mgr.add(ValueTypes.STRING.newValue('b'));
            const state = mgr.validate();

            expect(state.occurrenceValidation[0].validationResults).toEqual([{message: 'One', transient: true}]);
            expect(state.occurrenceValidation[1].validationResults).toHaveLength(0);
        });

        it('drops only the removed occurrence on remove(), preserving siblings via ID', () => {
            const mgr = createManager({values: ['a', 'b', 'c']});
            const [idA, idB, idC] = mgr.getIds();
            mgr.setTransientError(idA, 'A');
            mgr.setTransientError(idB, 'B');
            mgr.setTransientError(idC, 'C');

            mgr.remove(1);
            const state = mgr.validate();

            expect(state.occurrenceValidation).toHaveLength(2);
            expect(state.occurrenceValidation[0].validationResults).toEqual([{message: 'A', transient: true}]);
            expect(state.occurrenceValidation[1].validationResults).toEqual([{message: 'C', transient: true}]);
        });

        it('follows the moved occurrence to its new position via stable ID', () => {
            const mgr = createManager({values: ['a', 'b', 'c']});
            const [idA, , idC] = mgr.getIds();
            mgr.setTransientError(idA, 'A');
            mgr.setTransientError(idC, 'C');

            mgr.move(0, 2); // values: b, c, a — error on A should now render at index 2

            const state = mgr.validate();
            expect(state.occurrenceValidation[2].validationResults).toEqual([{message: 'A', transient: true}]);
            expect(state.occurrenceValidation[1].validationResults).toEqual([{message: 'C', transient: true}]);
            expect(state.occurrenceValidation[0].validationResults).toHaveLength(0);
        });

        it('captured ID survives intervening reorder before the error is pushed (the use case this fix targets)', () => {
            const mgr = createManager({values: ['a', 'b', 'c']});
            const idB = mgr.getIds()[1]; // simulate sync capture by an async caller

            mgr.move(1, 0); // values: b, a, c — idB now resides at index 0
            mgr.setTransientError(idB, 'Translation failed');

            const state = mgr.validate();
            expect(state.occurrenceValidation[0].validationResults).toEqual([
                {message: 'Translation failed', transient: true},
            ]);
            expect(state.occurrenceValidation[1].validationResults).toHaveLength(0);
            expect(state.occurrenceValidation[2].validationResults).toHaveLength(0);
        });

        it('clearTransientError removes a single entry by ID and returns true', () => {
            const mgr = createManager({values: ['a', 'b']});
            const [idA, idB] = mgr.getIds();
            mgr.setTransientError(idA, 'A');
            mgr.setTransientError(idB, 'B');

            expect(mgr.clearTransientError(idA)).toBe(true);
            const state = mgr.validate();

            expect(state.occurrenceValidation[0].validationResults).toHaveLength(0);
            expect(state.occurrenceValidation[1].validationResults).toEqual([{message: 'B', transient: true}]);
        });

        it('clearTransientError returns false when nothing exists for the ID', () => {
            const mgr = createManager({values: ['a']});
            const [id] = mgr.getIds();
            expect(mgr.clearTransientError(id)).toBe(false);
        });

        it('clearAllTransientErrors drops every entry', () => {
            const mgr = createManager({values: ['a', 'b']});
            const [idA, idB] = mgr.getIds();
            mgr.setTransientError(idA, 'A');
            mgr.setTransientError(idB, 'B');
            mgr.clearAllTransientErrors();

            expect(mgr.hasTransientErrors()).toBe(false);
            expect(mgr.validate().occurrenceValidation.every(ov => ov.validationResults.length === 0)).toBe(true);
        });

        it('overwrites the existing message when the same ID is set twice', () => {
            const mgr = createManager({values: ['a']});
            const [id] = mgr.getIds();
            mgr.setTransientError(id, 'first');
            mgr.setTransientError(id, 'second');

            expect(mgr.getTransientError(id)).toBe('second');
        });
    });

    describe('with DoubleDescriptor', () => {
        function createDoubleManager(opts: {min?: number; max?: number; values?: number[]} = {}) {
            const {min = 0, max = 0, values = []} = opts;
            const occurrences = Occurrences.minmax(min, max);
            const config: NumberConfig = {min: null, max: null};
            const initialValues = values.map(v => ValueTypes.DOUBLE.fromJsonValue(v));
            return new OccurrenceManager<NumberConfig>(occurrences, DoubleDescriptor, config, initialValues);
        }

        it('validates and counts numeric occurrences', () => {
            const mgr = createDoubleManager({min: 1, values: [3.14, 2.71]});
            const state = mgr.validate();
            expect(state.totalValid).toBe(2);
            expect(state.isMinimumBreached).toBe(false);
        });

        it('null breaks required for Double', () => {
            const mgr = createDoubleManager({min: 1});
            mgr.add(); // adds null double
            const state = mgr.validate();
            expect(state.occurrenceValidation[0].breaksRequired).toBe(true);
            expect(state.totalValid).toBe(0);
            expect(state.isMinimumBreached).toBe(true);
        });

        it('detects minimum breach with double values', () => {
            const mgr = createDoubleManager({min: 3, values: [1.0]});
            const state = mgr.validate();
            expect(state.isMinimumBreached).toBe(true);
            expect(state.isValid).toBe(false);
        });

        it('detects maximum breach with double values', () => {
            const occurrences = Occurrences.minmax(0, 2);
            const config: NumberConfig = {min: null, max: null};
            const values = [1.0, 2.0, 3.0].map(v => ValueTypes.DOUBLE.fromJsonValue(v));
            const mgr = new OccurrenceManager<NumberConfig>(occurrences, DoubleDescriptor, config, values);
            const state = mgr.validate();
            expect(state.isMaximumBreached).toBe(true);
        });
    });

    describe('with CheckboxDescriptor', () => {
        function createCheckboxManager(opts: {min?: number; max?: number; values?: boolean[]} = {}) {
            const {min = 0, max = 0, values = []} = opts;
            const occurrences = Occurrences.minmax(min, max);
            const config: CheckboxConfig = {alignment: 'LEFT'};
            const initialValues = values.map(v => ValueTypes.BOOLEAN.fromJsonValue(v));
            return new OccurrenceManager<CheckboxConfig>(occurrences, CheckboxDescriptor, config, initialValues);
        }

        it('validate always passes (no validation rules)', () => {
            const mgr = createCheckboxManager({values: [true, false]});
            const state = mgr.validate();
            expect(state.occurrenceValidation.every(ov => ov.validationResults.length === 0)).toBe(true);
        });

        it('counts valid boolean occurrences (only true satisfies required)', () => {
            const mgr = createCheckboxManager({min: 1, values: [true, false]});
            const state = mgr.validate();
            expect(state.totalValid).toBe(1);
            expect(state.isMinimumBreached).toBe(false);
        });

        it('null still breaks required for Checkbox', () => {
            const mgr = createCheckboxManager({min: 1});
            mgr.add(); // adds null boolean
            const state = mgr.validate();
            expect(state.occurrenceValidation[0].breaksRequired).toBe(true);
            expect(state.totalValid).toBe(0);
            expect(state.isMinimumBreached).toBe(true);
        });

        it('isValid reflects combined state for checkbox', () => {
            const mgr = createCheckboxManager({min: 1, values: [true]});
            const state = mgr.validate();
            expect(state.isValid).toBe(true);
        });
    });
});
