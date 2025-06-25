import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {Value} from '../../data/Value';
import {ValueTypes} from '../../data/ValueTypes';
import {DateDescriptor} from './DateDescriptor';
import type {DateConfig} from './InputTypeConfig';

describe('DateDescriptor', () => {
    describe('getValueType', () => {
        it('returns LOCAL_DATE', () => {
            expect(DateDescriptor.getValueType()).toBe(ValueTypes.LOCAL_DATE);
        });
    });

    describe('readConfig', () => {
        it('returns empty config object', () => {
            const config = DateDescriptor.readConfig({});
            expect(config).toEqual({});
        });

        it('ignores unknown config keys', () => {
            const config = DateDescriptor.readConfig({unknown: [{value: 'test'}]});
            expect(config).toEqual({});
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
    });

    describe('validate', () => {
        const config: DateConfig = {};

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
        it('accepts valid date with empty config', () => {
            const config = DateDescriptor.readConfig({});
            const value = ValueTypes.LOCAL_DATE.newValue('2025-12-31');
            expect(DateDescriptor.validate(value, config)).toEqual([]);
        });

        it('accepts null value with empty config', () => {
            const config = DateDescriptor.readConfig({});
            const value = ValueTypes.LOCAL_DATE.newNullValue();
            expect(DateDescriptor.validate(value, config)).toEqual([]);
        });
    });
});
