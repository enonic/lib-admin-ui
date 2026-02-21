import {describe, expect, it, vi} from 'vitest';
import {ValueTypes} from '../../main/resources/assets/admin/common/js/data/ValueTypes';
import {Occurrences} from '../../main/resources/assets/admin/common/js/form/Occurrences';
import {OccurrenceManager} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/OccurrenceManager';
import {TextLineDescriptor} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/TextLineDescriptor';
import {TextLineConfig, CheckboxConfig, NumberConfig} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/InputTypeConfig';
import {DoubleDescriptor} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/DoubleDescriptor';
import {CheckboxDescriptor} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/CheckboxDescriptor';

vi.mock('../../main/resources/assets/admin/common/js/util/Messages', () => ({
    i18n: (key: string, ...args: unknown[]) => `#${key}#`,
}));

function createManager(opts: {min?: number; max?: number; values?: string[]} = {}) {
    const {min = 0, max = 0, values = []} = opts;
    const occurrences = Occurrences.minmax(min, max);
    const config = TextLineDescriptor.readConfig({});
    const initialValues = values.map((v) => ValueTypes.STRING.newValue(v));
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
            expect(mgr.getValues().map((v) => v.getString())).toEqual(['b', 'c', 'a']);
        });

        it('reorders values backward', () => {
            const mgr = createManager({values: ['a', 'b', 'c']});
            mgr.move(2, 0);
            expect(mgr.getValues().map((v) => v.getString())).toEqual(['c', 'a', 'b']);
        });

        it('does nothing for same index', () => {
            const mgr = createManager({values: ['a', 'b']});
            mgr.move(0, 0);
            expect(mgr.getValues().map((v) => v.getString())).toEqual(['a', 'b']);
        });

        it('does nothing for out-of-bounds', () => {
            const mgr = createManager({values: ['a', 'b']});
            mgr.move(0, 5);
            expect(mgr.getValues().map((v) => v.getString())).toEqual(['a', 'b']);
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
            const values = ['a', 'b', 'c'].map((v) => ValueTypes.STRING.newValue(v));
            const mgr = new OccurrenceManager<TextLineConfig>(occurrences, TextLineDescriptor, config, values);
            const state = mgr.validate();
            expect(state.isMaximumBreached).toBe(true);
        });

        it('per-occurrence validation results from descriptor', () => {
            const occurrences = Occurrences.minmax(0, 0);
            const config: TextLineConfig = {regexp: /^[0-9]+$/, maxLength: -1, showCounter: false};
            const values = [
                ValueTypes.STRING.newValue('123'),
                ValueTypes.STRING.newValue('abc'),
            ];
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

    describe('with DoubleDescriptor', () => {
        function createDoubleManager(opts: {min?: number; max?: number; values?: number[]} = {}) {
            const {min = 0, max = 0, values = []} = opts;
            const occurrences = Occurrences.minmax(min, max);
            const config: NumberConfig = {min: null, max: null};
            const initialValues = values.map((v) => ValueTypes.DOUBLE.fromJsonValue(v));
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
            const values = [1.0, 2.0, 3.0].map((v) => ValueTypes.DOUBLE.fromJsonValue(v));
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
            const initialValues = values.map((v) => ValueTypes.BOOLEAN.fromJsonValue(v));
            return new OccurrenceManager<CheckboxConfig>(occurrences, CheckboxDescriptor, config, initialValues);
        }

        it('validate always passes (no validation rules)', () => {
            const mgr = createCheckboxManager({values: [true, false]});
            const state = mgr.validate();
            expect(state.occurrenceValidation.every(ov => ov.validationResults.length === 0)).toBe(true);
        });

        it('counts valid boolean occurrences', () => {
            const mgr = createCheckboxManager({min: 1, values: [true, false]});
            const state = mgr.validate();
            expect(state.totalValid).toBe(2);
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
