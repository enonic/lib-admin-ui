import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {Value} from '../../data/Value';
import {ValueTypes} from '../../data/ValueTypes';
import {DateDescriptor} from './DateDescriptor';
import type {DateConfig} from './InputTypeConfig';

vi.mock('../../util/Messages', () => ({
    i18n: (key: string, ..._args: unknown[]) => `#${key}#`,
}));

describe('DateDescriptor', () => {
    describe('getValueType', () => {
        it('returns LOCAL_DATE', () => {
            expect(DateDescriptor.getValueType()).toBe(ValueTypes.LOCAL_DATE);
        });
    });

    describe('readConfig', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2025-06-15T12:00:00'));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('returns undefined default when no config provided', () => {
            const config = DateDescriptor.readConfig({});
            expect(config.default).toBeUndefined();
        });

        it('ignores unknown config keys', () => {
            const config = DateDescriptor.readConfig({unknown: [{value: 'test'}]});
            expect(config.default).toBeUndefined();
        });

        it('parses absolute date string', () => {
            const config = DateDescriptor.readConfig({default: [{value: '2020-08-09'}]});
            expect(config.default).toBeInstanceOf(Date);
            expect(config.default?.getFullYear()).toBe(2020);
            expect(config.default?.getMonth()).toBe(7);
            expect(config.default?.getDate()).toBe(9);
        });

        it('parses "now" to current date', () => {
            const config = DateDescriptor.readConfig({default: [{value: 'now'}]});
            expect(config.default).toBeInstanceOf(Date);
            expect(config.default?.getFullYear()).toBe(2025);
            expect(config.default?.getMonth()).toBe(5);
            expect(config.default?.getDate()).toBe(15);
        });

        it('parses relative expression "+1d"', () => {
            const config = DateDescriptor.readConfig({default: [{value: '+1d'}]});
            expect(config.default).toBeInstanceOf(Date);
            expect(config.default?.getDate()).toBe(16);
        });

        it('parses relative expression "-2M +3d"', () => {
            const config = DateDescriptor.readConfig({default: [{value: '-2M +3d'}]});
            expect(config.default).toBeInstanceOf(Date);
            expect(config.default?.getMonth()).toBe(3);
            expect(config.default?.getDate()).toBe(18);
        });

        it('returns undefined for invalid string', () => {
            const config = DateDescriptor.readConfig({default: [{value: 'hello'}]});
            expect(config.default).toBeUndefined();
        });

        it('returns undefined for invalid date like 2020-99-99', () => {
            const config = DateDescriptor.readConfig({default: [{value: '2020-99-99'}]});
            expect(config.default).toBeUndefined();
        });

        it('returns undefined for empty string', () => {
            const config = DateDescriptor.readConfig({default: [{value: ''}]});
            expect(config.default).toBeUndefined();
        });

        it('returns undefined for non-string value', () => {
            const config = DateDescriptor.readConfig({default: [{value: 42}]});
            expect(config.default).toBeUndefined();
        });

        it('returns undefined for partial date string', () => {
            const config = DateDescriptor.readConfig({default: [{value: '2020-08'}]});
            expect(config.default).toBeUndefined();
        });
    });

    describe('createDefaultValue', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2025-06-15T12:00:00'));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('creates LOCAL_DATE value from valid date string', () => {
            const value = DateDescriptor.createDefaultValue('2025-01-15');
            expect(value).toBeInstanceOf(Value);
            expect(value.isNull()).toBe(false);
            expect(value.getType()).toBe(ValueTypes.LOCAL_DATE);
            expect(value.getString()).toBe('2025-01-15');
        });

        it('creates value from relative expression "now"', () => {
            const value = DateDescriptor.createDefaultValue('now');
            expect(value.isNull()).toBe(false);
            expect(value.getType()).toBe(ValueTypes.LOCAL_DATE);
            expect(value.getString()).toBe('2025-06-15');
        });

        it('creates value from relative expression "+1d"', () => {
            const value = DateDescriptor.createDefaultValue('+1d');
            expect(value.isNull()).toBe(false);
            expect(value.getString()).toBe('2025-06-16');
        });

        it('returns null Value for number input', () => {
            const value = DateDescriptor.createDefaultValue(42);
            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for null input', () => {
            const value = DateDescriptor.createDefaultValue(null);
            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for undefined input', () => {
            const value = DateDescriptor.createDefaultValue(undefined);
            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for garbage string', () => {
            const value = DateDescriptor.createDefaultValue('hello');
            expect(value.isNull()).toBe(true);
        });
    });

    describe('validate', () => {
        const config: DateConfig = {default: undefined};

        it('returns empty for null value', () => {
            const value = ValueTypes.LOCAL_DATE.newNullValue();
            expect(DateDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns empty for valid date string', () => {
            const value = ValueTypes.LOCAL_DATE.newValue('2025-01-15');
            expect(DateDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns empty for leap day', () => {
            const value = ValueTypes.LOCAL_DATE.newValue('2024-02-29');
            expect(DateDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns error for null value with non-empty rawValue', () => {
            const value = ValueTypes.LOCAL_DATE.newNullValue();
            const results = DateDescriptor.validate(value, config, '2024-01');
            expect(results).toHaveLength(1);
            expect(results[0].message).toBe('#field.value.invalid#');
        });

        it('returns empty for null value with empty rawValue', () => {
            const value = ValueTypes.LOCAL_DATE.newNullValue();
            expect(DateDescriptor.validate(value, config, '')).toEqual([]);
        });
    });

    describe('valueBreaksRequired', () => {
        it('returns true for null value', () => {
            const value = ValueTypes.LOCAL_DATE.newNullValue();
            expect(DateDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns true for wrong ValueType', () => {
            const value = ValueTypes.STRING.newValue('2025-01-15');
            expect(DateDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns false for valid local date value', () => {
            const value = ValueTypes.LOCAL_DATE.newValue('2025-01-15');
            expect(DateDescriptor.valueBreaksRequired(value)).toBe(false);
        });
    });

    describe('readConfig → validate integration', () => {
        it('accepts valid date with default config', () => {
            const config = DateDescriptor.readConfig({});
            const value = ValueTypes.LOCAL_DATE.newValue('2025-12-31');
            expect(DateDescriptor.validate(value, config)).toEqual([]);
        });

        it('accepts null value with default config', () => {
            const config = DateDescriptor.readConfig({});
            const value = ValueTypes.LOCAL_DATE.newNullValue();
            expect(DateDescriptor.validate(value, config)).toEqual([]);
        });
    });
});
