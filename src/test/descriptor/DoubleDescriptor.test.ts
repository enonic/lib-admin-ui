import {describe, expect, it} from 'vitest';
import {Value} from '../../main/resources/assets/admin/common/js/data/Value';
import {ValueTypes} from '../../main/resources/assets/admin/common/js/data/ValueTypes';
import {DoubleDescriptor} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/DoubleDescriptor';
import type {NumberConfig} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/InputTypeConfig';

describe('DoubleDescriptor', () => {
    describe('getValueType', () => {
        it('returns DOUBLE', () => {
            expect(DoubleDescriptor.getValueType()).toBe(ValueTypes.DOUBLE);
        });
    });

    describe('readConfig', () => {
        it('parses min and max from config', () => {
            const config = DoubleDescriptor.readConfig({
                min: [{value: -10.5}],
                max: [{value: 100.5}],
            });
            expect(config.min).toBe(-10.5);
            expect(config.max).toBe(100.5);
        });

        it('handles empty config', () => {
            const config = DoubleDescriptor.readConfig({});
            expect(config.min).toBeUndefined();
            expect(config.max).toBeUndefined();
        });

        it('handles only min set', () => {
            const config = DoubleDescriptor.readConfig({min: [{value: 0}]});
            expect(config.min).toBe(0);
            expect(config.max).toBeUndefined();
        });

        it('handles only max set', () => {
            const config = DoubleDescriptor.readConfig({max: [{value: 99.9}]});
            expect(config.min).toBeUndefined();
            expect(config.max).toBe(99.9);
        });

        it('handles missing value key in entry', () => {
            const config = DoubleDescriptor.readConfig({min: [{}]});
            expect(config.min).toBeUndefined();
        });
    });

    describe('createDefaultValue', () => {
        it('creates DOUBLE value from number input', () => {
            const value = DoubleDescriptor.createDefaultValue(3.14);
            expect(value).toBeInstanceOf(Value);
            expect(value.isNull()).toBe(false);
            expect(value.getDouble()).toBe(3.14);
            expect(value.getType()).toBe(ValueTypes.DOUBLE);
        });

        it('creates DOUBLE value from integer input', () => {
            const value = DoubleDescriptor.createDefaultValue(42);
            expect(value.isNull()).toBe(false);
            expect(value.getDouble()).toBe(42);
        });

        it('returns null Value for string input', () => {
            const value = DoubleDescriptor.createDefaultValue('3.14');
            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for null input', () => {
            const value = DoubleDescriptor.createDefaultValue(null);
            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for undefined input', () => {
            const value = DoubleDescriptor.createDefaultValue(undefined);
            expect(value.isNull()).toBe(true);
        });
    });

    describe('validate', () => {
        function makeConfig(overrides: Partial<NumberConfig> = {}): NumberConfig {
            return {min: undefined, max: undefined, ...overrides};
        }

        it('returns empty array for valid number', () => {
            const config = makeConfig();
            const value = ValueTypes.DOUBLE.fromJsonValue(3.14);
            expect(DoubleDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns empty for null value', () => {
            const config = makeConfig({min: 0, max: 100});
            const value = ValueTypes.DOUBLE.newNullValue();
            expect(DoubleDescriptor.validate(value, config)).toEqual([]);
        });

        it('detects value below min', () => {
            const config = makeConfig({min: 10});
            const value = ValueTypes.DOUBLE.fromJsonValue(5);
            const results = DoubleDescriptor.validate(value, config);
            expect(results).toHaveLength(1);
            expect(results[0].message).toBe('Value must be at least 10');
        });

        it('detects value above max', () => {
            const config = makeConfig({max: 100});
            const value = ValueTypes.DOUBLE.fromJsonValue(150);
            const results = DoubleDescriptor.validate(value, config);
            expect(results).toHaveLength(1);
            expect(results[0].message).toBe('Value must be at most 100');
        });

        it('reports only one violation (else-if): min takes precedence', () => {
            const config = makeConfig({min: 50, max: 10});
            const value = ValueTypes.DOUBLE.fromJsonValue(5);
            const results = DoubleDescriptor.validate(value, config);
            expect(results).toHaveLength(1);
            expect(results[0].message).toContain('at least');
        });

        it('allows value exactly at min boundary', () => {
            const config = makeConfig({min: 10});
            const value = ValueTypes.DOUBLE.fromJsonValue(10);
            expect(DoubleDescriptor.validate(value, config)).toEqual([]);
        });

        it('allows value exactly at max boundary', () => {
            const config = makeConfig({max: 100});
            const value = ValueTypes.DOUBLE.fromJsonValue(100);
            expect(DoubleDescriptor.validate(value, config)).toEqual([]);
        });

        it('handles fractional boundaries', () => {
            const config = makeConfig({min: 0.5, max: 9.9});
            const value = ValueTypes.DOUBLE.fromJsonValue(0.5);
            expect(DoubleDescriptor.validate(value, config)).toEqual([]);
        });

        it('allows negative numbers within range', () => {
            const config = makeConfig({min: -100, max: -10});
            const value = ValueTypes.DOUBLE.fromJsonValue(-50);
            expect(DoubleDescriptor.validate(value, config)).toEqual([]);
        });

        it('no validation when both min and max are null', () => {
            const config = makeConfig();
            const value = ValueTypes.DOUBLE.fromJsonValue(999999);
            expect(DoubleDescriptor.validate(value, config)).toEqual([]);
        });
    });

    describe('valueBreaksRequired', () => {
        it('returns true for null value', () => {
            const value = ValueTypes.DOUBLE.newNullValue();
            expect(DoubleDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns true for wrong ValueType', () => {
            const value = ValueTypes.STRING.newValue('3.14');
            expect(DoubleDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns false for valid double value', () => {
            const value = ValueTypes.DOUBLE.fromJsonValue(3.14);
            expect(DoubleDescriptor.valueBreaksRequired(value)).toBe(false);
        });

        it('returns false for zero', () => {
            const value = ValueTypes.DOUBLE.fromJsonValue(0);
            expect(DoubleDescriptor.valueBreaksRequired(value)).toBe(false);
        });
    });

    describe('readConfig → validate integration', () => {
        it('rejects value below min parsed from config', () => {
            const config = DoubleDescriptor.readConfig({min: [{value: 10}]});
            const results = DoubleDescriptor.validate(ValueTypes.DOUBLE.fromJsonValue(5), config);
            expect(results).toHaveLength(1);
            expect(results[0].message).toContain('at least');
        });

        it('rejects value above max parsed from config', () => {
            const config = DoubleDescriptor.readConfig({max: [{value: 100}]});
            const results = DoubleDescriptor.validate(ValueTypes.DOUBLE.fromJsonValue(200), config);
            expect(results).toHaveLength(1);
            expect(results[0].message).toContain('at most');
        });

        it('accepts any value with empty config', () => {
            const config = DoubleDescriptor.readConfig({});
            const results = DoubleDescriptor.validate(ValueTypes.DOUBLE.fromJsonValue(999), config);
            expect(results).toEqual([]);
        });
    });
});
