import {describe, expect, it} from 'vitest';
import {Value} from '../../data/Value';
import {ValueTypes} from '../../data/ValueTypes';
import type {TextAreaConfig} from './InputTypeConfig';
import {TextAreaDescriptor} from './TextAreaDescriptor';

describe('TextAreaDescriptor', () => {
    describe('getValueType', () => {
        it('returns STRING', () => {
            expect(TextAreaDescriptor.getValueType()).toBe(ValueTypes.STRING);
        });
    });

    describe('readConfig', () => {
        it('parses maxLength from config', () => {
            const config = TextAreaDescriptor.readConfig({maxLength: [{value: 200}]});
            expect(config.maxLength).toBe(200);
        });

        it('parses showCounter boolean', () => {
            const config = TextAreaDescriptor.readConfig({showCounter: [{value: true}]});
            expect(config.showCounter).toBe(true);
        });

        it('handles completely empty config', () => {
            const config = TextAreaDescriptor.readConfig({});
            expect(config.maxLength).toBe(-1);
            expect(config.showCounter).toBe(false);
        });

        it('handles missing keys gracefully', () => {
            const config = TextAreaDescriptor.readConfig({maxLength: [{value: 50}]});
            expect(config.maxLength).toBe(50);
            expect(config.showCounter).toBe(false);
        });

        it('returns maxLength -1 when value is 0', () => {
            const config = TextAreaDescriptor.readConfig({maxLength: [{value: 0}]});
            expect(config.maxLength).toBe(-1);
        });

        it('returns maxLength -1 when value is negative', () => {
            const config = TextAreaDescriptor.readConfig({maxLength: [{value: -10}]});
            expect(config.maxLength).toBe(-1);
        });
    });

    describe('createDefaultValue', () => {
        it('creates STRING value from string input', () => {
            const value = TextAreaDescriptor.createDefaultValue('multiline\ntext');
            expect(value).toBeInstanceOf(Value);
            expect(value.isNull()).toBe(false);
            expect(value.getString()).toBe('multiline\ntext');
            expect(value.getType()).toBe(ValueTypes.STRING);
        });

        it('returns null Value for number input', () => {
            const value = TextAreaDescriptor.createDefaultValue(42);
            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for null input', () => {
            const value = TextAreaDescriptor.createDefaultValue(null);
            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for undefined input', () => {
            const value = TextAreaDescriptor.createDefaultValue(undefined);
            expect(value.isNull()).toBe(true);
        });
    });

    describe('validate', () => {
        function makeConfig(overrides: Partial<TextAreaConfig> = {}): TextAreaConfig {
            return {maxLength: -1, showCounter: false, ...overrides};
        }

        it('returns empty array for valid input', () => {
            const config = makeConfig();
            const value = ValueTypes.STRING.newValue('hello');
            expect(TextAreaDescriptor.validate(value, config)).toEqual([]);
        });

        it('detects maxLength breach', () => {
            const config = makeConfig({maxLength: 5});
            const value = ValueTypes.STRING.newValue('toolong');
            const results = TextAreaDescriptor.validate(value, config);
            expect(results).toHaveLength(1);
            expect(results[0].message).toBe('Value exceeds maximum length of 5');
        });

        it('uses hardcoded message (not i18n)', () => {
            const config = makeConfig({maxLength: 10});
            const value = ValueTypes.STRING.newValue('a'.repeat(11));
            const results = TextAreaDescriptor.validate(value, config);
            expect(results[0].message).toBe('Value exceeds maximum length of 10');
        });

        it('returns empty for null value', () => {
            const config = makeConfig({maxLength: 5});
            const value = ValueTypes.STRING.newNullValue();
            expect(TextAreaDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns empty when maxLength is -1 (unlimited)', () => {
            const config = makeConfig({maxLength: -1});
            const value = ValueTypes.STRING.newValue('a'.repeat(10000));
            expect(TextAreaDescriptor.validate(value, config)).toEqual([]);
        });

        it('allows value exactly at maxLength boundary', () => {
            const config = makeConfig({maxLength: 5});
            const value = ValueTypes.STRING.newValue('exact');
            expect(TextAreaDescriptor.validate(value, config)).toEqual([]);
        });

        it('detects value one char over maxLength', () => {
            const config = makeConfig({maxLength: 5});
            const value = ValueTypes.STRING.newValue('exceed');
            const results = TextAreaDescriptor.validate(value, config);
            expect(results).toHaveLength(1);
        });
    });

    describe('valueBreaksRequired', () => {
        it('returns true for null value', () => {
            const value = ValueTypes.STRING.newNullValue();
            expect(TextAreaDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns true for wrong ValueType', () => {
            const value = ValueTypes.LONG.newValue('42');
            expect(TextAreaDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns true for blank string', () => {
            const value = ValueTypes.STRING.newValue('');
            expect(TextAreaDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns true for whitespace-only string', () => {
            const value = ValueTypes.STRING.newValue('   ');
            expect(TextAreaDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns false for valid non-empty string', () => {
            const value = ValueTypes.STRING.newValue('some text');
            expect(TextAreaDescriptor.valueBreaksRequired(value)).toBe(false);
        });
    });

    describe('readConfig → validate integration', () => {
        it('rejects value exceeding maxLength parsed from config', () => {
            const config = TextAreaDescriptor.readConfig({maxLength: [{value: 5}]});
            const results = TextAreaDescriptor.validate(ValueTypes.STRING.newValue('toolong'), config);
            expect(results).toHaveLength(1);
            expect(results[0].message).toBe('Value exceeds maximum length of 5');
        });

        it('accepts any value with empty config', () => {
            const config = TextAreaDescriptor.readConfig({});
            const results = TextAreaDescriptor.validate(ValueTypes.STRING.newValue('anything'), config);
            expect(results).toEqual([]);
        });

        it('treats maxLength 0 as unlimited (sentinel -1)', () => {
            const config = TextAreaDescriptor.readConfig({maxLength: [{value: 0}]});
            const results = TextAreaDescriptor.validate(ValueTypes.STRING.newValue('a'.repeat(1000)), config);
            expect(results).toEqual([]);
        });
    });
});
