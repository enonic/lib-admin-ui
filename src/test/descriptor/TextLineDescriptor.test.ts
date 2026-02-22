import {describe, expect, it, vi} from 'vitest';
import {Value} from '../../main/resources/assets/admin/common/js/data/Value';
import {ValueTypes} from '../../main/resources/assets/admin/common/js/data/ValueTypes';
import type {TextLineConfig} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/InputTypeConfig';
import {TextLineDescriptor} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/TextLineDescriptor';

vi.mock('../../main/resources/assets/admin/common/js/util/Messages', () => ({
    i18n: (key: string, ..._args: unknown[]) => `#${key}#`,
}));

describe('TextLineDescriptor', () => {
    describe('getValueType', () => {
        it('returns STRING', () => {
            expect(TextLineDescriptor.getValueType()).toBe(ValueTypes.STRING);
        });
    });

    describe('readConfig', () => {
        it('parses regexp from config', () => {
            const config = TextLineDescriptor.readConfig({regexp: [{value: '^[A-Z]+$'}]});
            expect(config.regexp).toBeInstanceOf(RegExp);
            expect(config.regexp?.source).toBe('^[A-Z]+$');
        });

        it('parses maxLength from config', () => {
            const config = TextLineDescriptor.readConfig({maxLength: [{value: 100}]});
            expect(config.maxLength).toBe(100);
        });

        it('parses showCounter boolean', () => {
            const config = TextLineDescriptor.readConfig({showCounter: [{value: true}]});
            expect(config.showCounter).toBe(true);
        });

        it('handles completely empty config', () => {
            const config = TextLineDescriptor.readConfig({});
            expect(config.regexp).toBeUndefined();
            expect(config.maxLength).toBe(-1);
            expect(config.showCounter).toBe(false);
        });

        it('handles missing keys gracefully', () => {
            const config = TextLineDescriptor.readConfig({maxLength: [{value: 50}]});
            expect(config.regexp).toBeUndefined();
            expect(config.maxLength).toBe(50);
            expect(config.showCounter).toBe(false);
        });

        it('returns maxLength -1 when value is 0', () => {
            const config = TextLineDescriptor.readConfig({maxLength: [{value: 0}]});
            expect(config.maxLength).toBe(-1);
        });

        it('returns maxLength -1 when value is negative', () => {
            const config = TextLineDescriptor.readConfig({maxLength: [{value: -5}]});
            expect(config.maxLength).toBe(-1);
        });

        it('returns regexp undefined when value is blank', () => {
            const config = TextLineDescriptor.readConfig({regexp: [{value: '  '}]});
            expect(config.regexp).toBeUndefined();
        });

        it('returns regexp undefined when value is empty string', () => {
            const config = TextLineDescriptor.readConfig({regexp: [{value: ''}]});
            expect(config.regexp).toBeUndefined();
        });

        it('returns regexp undefined when value is missing', () => {
            const config = TextLineDescriptor.readConfig({regexp: [{}]});
            expect(config.regexp).toBeUndefined();
        });
    });

    describe('createDefaultValue', () => {
        it('creates STRING value from string input', () => {
            const value = TextLineDescriptor.createDefaultValue('hello');
            expect(value).toBeInstanceOf(Value);
            expect(value.isNull()).toBe(false);
            expect(value.getString()).toBe('hello');
            expect(value.getType()).toBe(ValueTypes.STRING);
        });

        it('returns null Value for number input', () => {
            const value = TextLineDescriptor.createDefaultValue(42);
            expect(value).toBeInstanceOf(Value);
            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for null input', () => {
            const value = TextLineDescriptor.createDefaultValue(null);
            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for undefined input', () => {
            const value = TextLineDescriptor.createDefaultValue(undefined);
            expect(value.isNull()).toBe(true);
        });
    });

    describe('validate', () => {
        function makeConfig(overrides: Partial<TextLineConfig> = {}): TextLineConfig {
            return {regexp: undefined, maxLength: -1, showCounter: false, ...overrides};
        }

        it('returns empty array for valid input', () => {
            const config = makeConfig();
            const value = ValueTypes.STRING.newValue('hello');
            expect(TextLineDescriptor.validate(value, config)).toEqual([]);
        });

        it('detects maxLength breach', () => {
            const config = makeConfig({maxLength: 5});
            const value = ValueTypes.STRING.newValue('toolong');
            const results = TextLineDescriptor.validate(value, config);
            expect(results).toHaveLength(1);
            expect(results[0].message).toContain('field.value.breaks.maxlength');
        });

        it('detects regexp mismatch', () => {
            const config = makeConfig({regexp: /^[A-Z]+$/});
            const value = ValueTypes.STRING.newValue('lowercase');
            const results = TextLineDescriptor.validate(value, config);
            expect(results).toHaveLength(1);
            expect(results[0].message).toContain('field.value.invalid');
        });

        it('returns empty for null value', () => {
            const config = makeConfig({maxLength: 5, regexp: /^[A-Z]+$/});
            const value = ValueTypes.STRING.newNullValue();
            expect(TextLineDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns empty when maxLength is -1 (unlimited)', () => {
            const config = makeConfig({maxLength: -1});
            const value = ValueTypes.STRING.newValue('a'.repeat(1000));
            expect(TextLineDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns empty when regexp is undefined', () => {
            const config = makeConfig({regexp: undefined});
            const value = ValueTypes.STRING.newValue('anything goes');
            expect(TextLineDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns multiple violations for both maxLength and regexp', () => {
            const config = makeConfig({maxLength: 3, regexp: /^[0-9]+$/});
            const value = ValueTypes.STRING.newValue('abcdef');
            const results = TextLineDescriptor.validate(value, config);
            expect(results).toHaveLength(2);
        });
    });

    describe('readConfig → validate integration', () => {
        it('rejects value exceeding maxLength parsed from config', () => {
            const config = TextLineDescriptor.readConfig({maxLength: [{value: 5}]});
            const results = TextLineDescriptor.validate(ValueTypes.STRING.newValue('toolong'), config);
            expect(results).toHaveLength(1);
            expect(results[0].message).toContain('field.value.breaks.maxlength');
        });

        it('rejects value not matching regexp parsed from config', () => {
            const config = TextLineDescriptor.readConfig({regexp: [{value: '^[A-Z]+$'}]});
            const results = TextLineDescriptor.validate(ValueTypes.STRING.newValue('lower'), config);
            expect(results).toHaveLength(1);
            expect(results[0].message).toContain('field.value.invalid');
        });

        it('accepts any value with empty config', () => {
            const config = TextLineDescriptor.readConfig({});
            const results = TextLineDescriptor.validate(ValueTypes.STRING.newValue('anything'), config);
            expect(results).toEqual([]);
        });

        it('treats maxLength 0 as unlimited (sentinel -1)', () => {
            const config = TextLineDescriptor.readConfig({maxLength: [{value: 0}]});
            const results = TextLineDescriptor.validate(ValueTypes.STRING.newValue('a'.repeat(1000)), config);
            expect(results).toEqual([]);
        });
    });

    describe('readConfig edge cases', () => {
        it('throws on invalid regexp pattern', () => {
            expect(() => {
                TextLineDescriptor.readConfig({regexp: [{value: '(unclosed'}]});
            }).toThrow();
        });
    });

    describe('valueBreaksRequired', () => {
        it('returns true for null value', () => {
            const value = ValueTypes.STRING.newNullValue();
            expect(TextLineDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns true for wrong ValueType', () => {
            const value = ValueTypes.LONG.newValue('42');
            expect(TextLineDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns true for blank string', () => {
            const value = ValueTypes.STRING.newValue('');
            expect(TextLineDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns true for whitespace-only string', () => {
            const value = ValueTypes.STRING.newValue('   ');
            expect(TextLineDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns false for valid non-empty string', () => {
            const value = ValueTypes.STRING.newValue('hello');
            expect(TextLineDescriptor.valueBreaksRequired(value)).toBe(false);
        });
    });
});
