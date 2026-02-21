import {describe, expect, it} from 'vitest';
import {Value} from '../../main/resources/assets/admin/common/js/data/Value';
import {ValueTypes} from '../../main/resources/assets/admin/common/js/data/ValueTypes';
import {LongDescriptor} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/LongDescriptor';
import {NumberConfig} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/InputTypeConfig';

describe('LongDescriptor', () => {

    describe('getValueType', () => {
        it('returns LONG', () => {
            expect(LongDescriptor.getValueType()).toBe(ValueTypes.LONG);
        });
    });

    describe('readConfig', () => {
        it('parses min and max from config', () => {
            const config = LongDescriptor.readConfig({
                'min': [{'value': -100}],
                'max': [{'value': 100}],
            });
            expect(config.min).toBe(-100);
            expect(config.max).toBe(100);
        });

        it('handles empty config', () => {
            const config = LongDescriptor.readConfig({});
            expect(config.min).toBeNull();
            expect(config.max).toBeNull();
        });

        it('handles only min set', () => {
            const config = LongDescriptor.readConfig({'min': [{'value': 0}]});
            expect(config.min).toBe(0);
            expect(config.max).toBeNull();
        });

        it('handles only max set', () => {
            const config = LongDescriptor.readConfig({'max': [{'value': 999}]});
            expect(config.min).toBeNull();
            expect(config.max).toBe(999);
        });

        it('handles missing value key in entry', () => {
            const config = LongDescriptor.readConfig({'min': [{}]});
            expect(config.min).toBeNull();
        });
    });

    describe('createDefaultValue', () => {
        it('creates LONG value from integer input', () => {
            const value = LongDescriptor.createDefaultValue(42);
            expect(value).toBeInstanceOf(Value);
            expect(value.isNull()).toBe(false);
            expect(value.getLong()).toBe(42);
            expect(value.getType()).toBe(ValueTypes.LONG);
        });

        it('creates LONG value from zero', () => {
            const value = LongDescriptor.createDefaultValue(0);
            expect(value.isNull()).toBe(false);
            expect(value.getLong()).toBe(0);
        });

        it('returns null Value for string input', () => {
            const value = LongDescriptor.createDefaultValue('42');
            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for null input', () => {
            const value = LongDescriptor.createDefaultValue(null);
            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for undefined input', () => {
            const value = LongDescriptor.createDefaultValue(undefined);
            expect(value.isNull()).toBe(true);
        });
    });

    describe('validate', () => {
        function makeConfig(overrides: Partial<NumberConfig> = {}): NumberConfig {
            return {min: null, max: null, ...overrides};
        }

        it('returns empty array for valid whole number', () => {
            const config = makeConfig();
            const value = ValueTypes.LONG.fromJsonValue(42);
            expect(LongDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns empty for null value', () => {
            const config = makeConfig({min: 0, max: 100});
            const value = ValueTypes.LONG.newNullValue();
            expect(LongDescriptor.validate(value, config)).toEqual([]);
        });

        it('detects value below min', () => {
            const config = makeConfig({min: 10});
            const value = ValueTypes.LONG.fromJsonValue(5);
            const results = LongDescriptor.validate(value, config);
            expect(results).toHaveLength(1);
            expect(results[0].message).toBe('Value must be at least 10');
        });

        it('detects value above max', () => {
            const config = makeConfig({max: 100});
            const value = ValueTypes.LONG.fromJsonValue(150);
            const results = LongDescriptor.validate(value, config);
            expect(results).toHaveLength(1);
            expect(results[0].message).toBe('Value must be at most 100');
        });

        it('reports only one violation (else-if): min takes precedence', () => {
            const config = makeConfig({min: 50, max: 10});
            const value = ValueTypes.LONG.fromJsonValue(5);
            const results = LongDescriptor.validate(value, config);
            expect(results).toHaveLength(1);
            expect(results[0].message).toContain('at least');
        });

        it('allows value exactly at min boundary', () => {
            const config = makeConfig({min: 10});
            const value = ValueTypes.LONG.fromJsonValue(10);
            expect(LongDescriptor.validate(value, config)).toEqual([]);
        });

        it('allows value exactly at max boundary', () => {
            const config = makeConfig({max: 100});
            const value = ValueTypes.LONG.fromJsonValue(100);
            expect(LongDescriptor.validate(value, config)).toEqual([]);
        });

        it('allows negative numbers within range', () => {
            const config = makeConfig({min: -100, max: -10});
            const value = ValueTypes.LONG.fromJsonValue(-50);
            expect(LongDescriptor.validate(value, config)).toEqual([]);
        });

        it('no validation when both min and max are null', () => {
            const config = makeConfig();
            const value = ValueTypes.LONG.fromJsonValue(999999);
            expect(LongDescriptor.validate(value, config)).toEqual([]);
        });

        it('allows zero as valid whole number', () => {
            const config = makeConfig({min: -10, max: 10});
            const value = ValueTypes.LONG.fromJsonValue(0);
            expect(LongDescriptor.validate(value, config)).toEqual([]);
        });
    });

    describe('valueBreaksRequired', () => {
        it('returns true for null value', () => {
            const value = ValueTypes.LONG.newNullValue();
            expect(LongDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns true for wrong ValueType', () => {
            const value = ValueTypes.STRING.newValue('42');
            expect(LongDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns false for valid long value', () => {
            const value = ValueTypes.LONG.fromJsonValue(42);
            expect(LongDescriptor.valueBreaksRequired(value)).toBe(false);
        });

        it('returns false for zero', () => {
            const value = ValueTypes.LONG.fromJsonValue(0);
            expect(LongDescriptor.valueBreaksRequired(value)).toBe(false);
        });
    });

    describe('readConfig → validate integration', () => {
        it('rejects value below min parsed from config', () => {
            const config = LongDescriptor.readConfig({'min': [{'value': 10}]});
            const results = LongDescriptor.validate(ValueTypes.LONG.fromJsonValue(5), config);
            expect(results).toHaveLength(1);
            expect(results[0].message).toContain('at least');
        });

        it('rejects value above max parsed from config', () => {
            const config = LongDescriptor.readConfig({'max': [{'value': 100}]});
            const results = LongDescriptor.validate(ValueTypes.LONG.fromJsonValue(200), config);
            expect(results).toHaveLength(1);
            expect(results[0].message).toContain('at most');
        });

        it('accepts any value with empty config', () => {
            const config = LongDescriptor.readConfig({});
            const results = LongDescriptor.validate(ValueTypes.LONG.fromJsonValue(999), config);
            expect(results).toEqual([]);
        });
    });
});
