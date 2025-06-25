import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {Value} from '../../data/Value';
import {ValueTypes} from '../../data/ValueTypes';
import type {TimeConfig} from './InputTypeConfig';
import {TimeDescriptor} from './TimeDescriptor';

describe('TimeDescriptor', () => {
    describe('getValueType', () => {
        it('returns LOCAL_TIME', () => {
            expect(TimeDescriptor.getValueType()).toBe(ValueTypes.LOCAL_TIME);
        });
    });

    describe('readConfig', () => {
        it('returns empty config object', () => {
            const config = TimeDescriptor.readConfig({});
            expect(config).toEqual({});
        });

        it('ignores unknown config keys', () => {
            const config = TimeDescriptor.readConfig({unknown: [{value: 'test'}]});
            expect(config).toEqual({});
        });
    });

    describe('createDefaultValue', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2025-06-15T14:30:00'));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('creates LOCAL_TIME value from HH:MM string', () => {
            const value = TimeDescriptor.createDefaultValue('14:30');
            expect(value).toBeInstanceOf(Value);
            expect(value.isNull()).toBe(false);
            expect(value.getType()).toBe(ValueTypes.LOCAL_TIME);
        });

        it('creates LOCAL_TIME value from HH:MM:SS string', () => {
            const value = TimeDescriptor.createDefaultValue('14:30:45');
            expect(value.isNull()).toBe(false);
            expect(value.getType()).toBe(ValueTypes.LOCAL_TIME);
        });

        it('returns null for HH:MM:SS.mmm (LocalTime does not support fractions)', () => {
            const value = TimeDescriptor.createDefaultValue('14:30:45.123');
            // TIME_PATTERN matches the string, but LocalTime.isValidString rejects fractions
            // so newValue returns null
            expect(value.isNull()).toBe(true);
        });

        it('creates value from relative expression "now"', () => {
            const value = TimeDescriptor.createDefaultValue('now');
            expect(value.isNull()).toBe(false);
            expect(value.getType()).toBe(ValueTypes.LOCAL_TIME);
        });

        it('returns null Value for number input', () => {
            const value = TimeDescriptor.createDefaultValue(42);
            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for null input', () => {
            const value = TimeDescriptor.createDefaultValue(null);
            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for undefined input', () => {
            const value = TimeDescriptor.createDefaultValue(undefined);
            expect(value.isNull()).toBe(true);
        });
    });

    describe('validate', () => {
        const config: TimeConfig = {};

        it('returns empty for null value', () => {
            const value = ValueTypes.LOCAL_TIME.newNullValue();
            expect(TimeDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns empty for valid HH:MM time', () => {
            const value = ValueTypes.LOCAL_TIME.newValue('14:30');
            expect(TimeDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns empty for valid HH:MM:SS time', () => {
            const value = ValueTypes.LOCAL_TIME.newValue('14:30:45');
            expect(TimeDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns empty for valid time with fractions', () => {
            const value = ValueTypes.LOCAL_TIME.newValue('14:30:45.123');
            expect(TimeDescriptor.validate(value, config)).toEqual([]);
        });
    });

    describe('valueBreaksRequired', () => {
        it('returns true for null value', () => {
            const value = ValueTypes.LOCAL_TIME.newNullValue();
            expect(TimeDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns true for wrong ValueType', () => {
            const value = ValueTypes.STRING.newValue('14:30');
            expect(TimeDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns false for valid local time value', () => {
            const value = ValueTypes.LOCAL_TIME.newValue('14:30');
            expect(TimeDescriptor.valueBreaksRequired(value)).toBe(false);
        });
    });

    describe('readConfig → validate integration', () => {
        it('accepts valid time with empty config', () => {
            const config = TimeDescriptor.readConfig({});
            const value = ValueTypes.LOCAL_TIME.newValue('23:59');
            expect(TimeDescriptor.validate(value, config)).toEqual([]);
        });

        it('accepts null value with empty config', () => {
            const config = TimeDescriptor.readConfig({});
            const value = ValueTypes.LOCAL_TIME.newNullValue();
            expect(TimeDescriptor.validate(value, config)).toEqual([]);
        });
    });
});
