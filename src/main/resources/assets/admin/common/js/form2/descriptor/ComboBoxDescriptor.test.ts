import {describe, expect, it} from 'vitest';
import {Value} from '../../data/Value';
import {ValueTypes} from '../../data/ValueTypes';
import {ComboBoxDescriptor} from './ComboBoxDescriptor';
import type {ComboBoxConfig} from './InputTypeConfig';

describe('ComboBoxDescriptor', () => {
    describe('getValueType', () => {
        it('returns STRING', () => {
            expect(ComboBoxDescriptor.getValueType()).toBe(ValueTypes.STRING);
        });
    });

    describe('readConfig', () => {
        it('parses options with label and value', () => {
            const config = ComboBoxDescriptor.readConfig({
                options: [
                    {value: 'Option A', '@value': 'a'},
                    {value: 'Option B', '@value': 'b'},
                ],
            });
            expect(config.options).toHaveLength(2);
            expect(config.options[0]).toEqual({label: 'Option A', value: 'a'});
            expect(config.options[1]).toEqual({label: 'Option B', value: 'b'});
        });

        it('handles empty options array', () => {
            const config = ComboBoxDescriptor.readConfig({options: []});
            expect(config.options).toEqual([]);
        });

        it('handles missing options key', () => {
            const config = ComboBoxDescriptor.readConfig({});
            expect(config.options).toEqual([]);
        });

        it('parses single option', () => {
            const config = ComboBoxDescriptor.readConfig({
                options: [{value: 'Only', '@value': 'only'}],
            });
            expect(config.options).toHaveLength(1);
            expect(config.options[0].value).toBe('only');
        });
    });

    describe('createDefaultValue', () => {
        it('creates STRING value from string input', () => {
            const value = ComboBoxDescriptor.createDefaultValue('a');
            expect(value).toBeInstanceOf(Value);
            expect(value.isNull()).toBe(false);
            expect(value.getString()).toBe('a');
            expect(value.getType()).toBe(ValueTypes.STRING);
        });

        it('returns null Value for number input', () => {
            const value = ComboBoxDescriptor.createDefaultValue(42);
            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for null input', () => {
            const value = ComboBoxDescriptor.createDefaultValue(null);
            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for undefined input', () => {
            const value = ComboBoxDescriptor.createDefaultValue(undefined);
            expect(value.isNull()).toBe(true);
        });
    });

    describe('validate', () => {
        const options: ComboBoxConfig = {
            options: [
                {label: 'Option A', value: 'a'},
                {label: 'Option B', value: 'b'},
                {label: 'Option C', value: 'c'},
            ],
        };

        it('returns empty array for valid option', () => {
            const value = ValueTypes.STRING.newValue('a');
            expect(ComboBoxDescriptor.validate(value, options)).toEqual([]);
        });

        it('detects value not in allowed options', () => {
            const value = ValueTypes.STRING.newValue('invalid');
            const results = ComboBoxDescriptor.validate(value, options);
            expect(results).toHaveLength(1);
            expect(results[0].message).toBe('Value is not one of the allowed options');
        });

        it('validates against @value, not label', () => {
            const value = ValueTypes.STRING.newValue('Option A');
            const results = ComboBoxDescriptor.validate(value, options);
            expect(results).toHaveLength(1);
        });

        it('returns empty for null value', () => {
            const value = ValueTypes.STRING.newNullValue();
            expect(ComboBoxDescriptor.validate(value, options)).toEqual([]);
        });

        it('returns empty when options list is empty', () => {
            const config: ComboBoxConfig = {options: []};
            const value = ValueTypes.STRING.newNullValue();
            expect(ComboBoxDescriptor.validate(value, config)).toEqual([]);
        });

        it('rejects value when options list is empty and value is not null', () => {
            const config: ComboBoxConfig = {options: []};
            const value = ValueTypes.STRING.newValue('anything');
            const results = ComboBoxDescriptor.validate(value, config);
            expect(results).toHaveLength(1);
        });
    });

    describe('valueBreaksRequired', () => {
        it('returns true for null value', () => {
            const value = ValueTypes.STRING.newNullValue();
            expect(ComboBoxDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns true for wrong ValueType', () => {
            const value = ValueTypes.LONG.newValue('42');
            expect(ComboBoxDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns false for valid string value', () => {
            const value = ValueTypes.STRING.newValue('a');
            expect(ComboBoxDescriptor.valueBreaksRequired(value)).toBe(false);
        });
    });

    describe('readConfig → validate integration', () => {
        it('accepts value matching parsed @value', () => {
            const config = ComboBoxDescriptor.readConfig({
                options: [{value: 'Label', '@value': 'key1'}],
            });
            const results = ComboBoxDescriptor.validate(ValueTypes.STRING.newValue('key1'), config);
            expect(results).toEqual([]);
        });

        it('rejects value not in parsed options', () => {
            const config = ComboBoxDescriptor.readConfig({
                options: [{value: 'Label', '@value': 'key1'}],
            });
            const results = ComboBoxDescriptor.validate(ValueTypes.STRING.newValue('key2'), config);
            expect(results).toHaveLength(1);
        });

        it('handles empty config options gracefully', () => {
            const config = ComboBoxDescriptor.readConfig({});
            const results = ComboBoxDescriptor.validate(ValueTypes.STRING.newNullValue(), config);
            expect(results).toEqual([]);
        });
    });
});
