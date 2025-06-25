import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {Value} from '../../data/Value';
import {ValueTypes} from '../../data/ValueTypes';
import type {TimeConfig} from './InputTypeConfig';
import {TimeDescriptor} from './TimeDescriptor';

vi.mock('../../util/Messages', () => ({
    i18n: (key: string, ..._args: unknown[]) => `#${key}#`,
}));

describe('TimeDescriptor', () => {
    describe('getValueType', () => {
        it('returns LOCAL_TIME', () => {
            expect(TimeDescriptor.getValueType()).toBe(ValueTypes.LOCAL_TIME);
        });
    });

    describe('readConfig', () => {
        it('returns default undefined when no default configured', () => {
            const config = TimeDescriptor.readConfig({});
            expect(config).toEqual({default: undefined});
        });

        it('ignores unknown config keys', () => {
            const config = TimeDescriptor.readConfig({unknown: [{value: 'test'}]});
            expect(config).toEqual({default: undefined});
        });

        it('parses absolute HH:MM time', () => {
            const config = TimeDescriptor.readConfig({default: [{value: '14:30'}]});
            expect(config.default).toBeInstanceOf(Date);
            expect(config.default?.getHours()).toBe(14);
            expect(config.default?.getMinutes()).toBe(30);
        });

        it('parses absolute HH:MM with leading zeros', () => {
            const config = TimeDescriptor.readConfig({default: [{value: '09:05'}]});
            expect(config.default).toBeInstanceOf(Date);
            expect(config.default?.getHours()).toBe(9);
            expect(config.default?.getMinutes()).toBe(5);
        });

        it('returns undefined for invalid time format', () => {
            const config = TimeDescriptor.readConfig({default: [{value: 'not-a-time'}]});
            expect(config.default).toBeUndefined();
        });

        it('returns undefined for empty string', () => {
            const config = TimeDescriptor.readConfig({default: [{value: ''}]});
            expect(config.default).toBeUndefined();
        });

        it('returns undefined for missing value', () => {
            const config = TimeDescriptor.readConfig({default: [{}]});
            expect(config.default).toBeUndefined();
        });

        describe('relative expressions', () => {
            beforeEach(() => {
                vi.useFakeTimers();
                vi.setSystemTime(new Date('2025-06-15T14:30:00'));
            });

            afterEach(() => {
                vi.useRealTimers();
            });

            it('parses "now" as current time', () => {
                const config = TimeDescriptor.readConfig({default: [{value: 'now'}]});
                expect(config.default).toBeInstanceOf(Date);
            });

            it('parses relative offset "+1h"', () => {
                const config = TimeDescriptor.readConfig({default: [{value: '+1h'}]});
                expect(config.default).toBeInstanceOf(Date);
            });

            it('returns undefined for invalid relative expression', () => {
                const config = TimeDescriptor.readConfig({default: [{value: 'invalid-expr'}]});
                expect(config.default).toBeUndefined();
            });
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

        it('returns null Value for garbage string', () => {
            const value = TimeDescriptor.createDefaultValue('garbage');
            expect(value.isNull()).toBe(true);
        });
    });

    describe('validate', () => {
        const config: TimeConfig = {default: undefined};

        it('returns empty for null value with no rawValue', () => {
            const value = ValueTypes.LOCAL_TIME.newNullValue();
            expect(TimeDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns error for null value with non-empty rawValue', () => {
            const value = ValueTypes.LOCAL_TIME.newNullValue();
            const results = TimeDescriptor.validate(value, config, '14:');
            expect(results).toHaveLength(1);
        });

        it('returns empty for null value with empty rawValue', () => {
            const value = ValueTypes.LOCAL_TIME.newNullValue();
            expect(TimeDescriptor.validate(value, config, '')).toEqual([]);
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
