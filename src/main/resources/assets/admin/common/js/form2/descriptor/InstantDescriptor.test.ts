import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {Value} from '../../data/Value';
import {ValueTypes} from '../../data/ValueTypes';
import type {InstantConfig} from './InputTypeConfig';
import {InstantDescriptor} from './InstantDescriptor';

vi.mock('../../util/Messages', () => ({
    i18n: (key: string, ..._args: unknown[]) => `#${key}#`,
}));

describe('InstantDescriptor', () => {
    describe('getValueType', () => {
        it('returns DATE_TIME', () => {
            expect(InstantDescriptor.getValueType()).toBe(ValueTypes.DATE_TIME);
        });
    });

    describe('readConfig', () => {
        it('returns default undefined by default', () => {
            const config = InstantDescriptor.readConfig({});

            expect(config.default).toBeUndefined();
        });

        it('ignores unknown config keys', () => {
            const config = InstantDescriptor.readConfig({unknown: [{value: 'test'}]});

            expect(config.default).toBeUndefined();
        });

        it('parses absolute instant with Z suffix', () => {
            const config = InstantDescriptor.readConfig({default: [{value: '2025-06-15T14:30:00Z'}]});

            expect(config.default).toBeInstanceOf(Date);
            expect(config.default?.getUTCFullYear()).toBe(2025);
            expect(config.default?.getUTCMonth()).toBe(5);
            expect(config.default?.getUTCDate()).toBe(15);
            expect(config.default?.getUTCHours()).toBe(14);
            expect(config.default?.getUTCMinutes()).toBe(30);
        });

        it('parses absolute datetime without Z suffix', () => {
            const config = InstantDescriptor.readConfig({default: [{value: '2025-06-15T14:30'}]});

            expect(config.default).toBeInstanceOf(Date);
        });

        it('parses absolute datetime with positive offset', () => {
            const config = InstantDescriptor.readConfig({default: [{value: '2000-01-01T12:30+01:00'}]});

            expect(config.default).toBeInstanceOf(Date);
            expect(config.default?.getUTCHours()).toBe(11);
            expect(config.default?.getUTCMinutes()).toBe(30);
        });

        it('parses absolute datetime with negative offset', () => {
            const config = InstantDescriptor.readConfig({default: [{value: '2025-06-15T08:00-05:00'}]});

            expect(config.default).toBeInstanceOf(Date);
            expect(config.default?.getUTCHours()).toBe(13);
        });

        it('parses absolute datetime with half-hour offset', () => {
            const config = InstantDescriptor.readConfig({default: [{value: '2025-06-15T18:00+05:30'}]});

            expect(config.default).toBeInstanceOf(Date);
            expect(config.default?.getUTCHours()).toBe(12);
            expect(config.default?.getUTCMinutes()).toBe(30);
        });

        it('parses absolute datetime with +00:00 offset', () => {
            const config = InstantDescriptor.readConfig({default: [{value: '2025-06-15T14:30+00:00'}]});

            expect(config.default).toBeInstanceOf(Date);
            expect(config.default?.getUTCHours()).toBe(14);
            expect(config.default?.getUTCMinutes()).toBe(30);
        });

        it('parses offset datetime with seconds', () => {
            const config = InstantDescriptor.readConfig({default: [{value: '2025-06-15T14:30:45+02:00'}]});

            expect(config.default).toBeInstanceOf(Date);
            expect(config.default?.getUTCHours()).toBe(12);
            expect(config.default?.getUTCSeconds()).toBe(45);
        });

        it('parses offset datetime with +04:00', () => {
            const config = InstantDescriptor.readConfig({default: [{value: '2026-09-09T12:00:00+04:00'}]});

            expect(config.default).toBeInstanceOf(Date);
            expect(config.default?.getUTCFullYear()).toBe(2026);
            expect(config.default?.getUTCMonth()).toBe(8);
            expect(config.default?.getUTCDate()).toBe(9);
            expect(config.default?.getUTCHours()).toBe(8);
            expect(config.default?.getUTCMinutes()).toBe(0);
        });

        it('parses absolute datetime with seconds and Z', () => {
            const config = InstantDescriptor.readConfig({default: [{value: '2025-06-15T14:30:45Z'}]});

            expect(config.default).toBeInstanceOf(Date);
        });

        it('returns undefined for invalid datetime format', () => {
            const config = InstantDescriptor.readConfig({default: [{value: 'not-a-datetime'}]});

            expect(config.default).toBeUndefined();
        });

        it('returns undefined for date-only string', () => {
            const config = InstantDescriptor.readConfig({default: [{value: '2025-06-15'}]});

            expect(config.default).toBeUndefined();
        });

        it('returns undefined for display format with space', () => {
            const config = InstantDescriptor.readConfig({default: [{value: '2025-06-15 14:30'}]});

            expect(config.default).toBeUndefined();
        });

        it('returns undefined for non-string value', () => {
            const config = InstantDescriptor.readConfig({default: [{value: 12345}]});

            expect(config.default).toBeUndefined();
        });

        it('returns undefined for empty string', () => {
            const config = InstantDescriptor.readConfig({default: [{value: ''}]});

            expect(config.default).toBeUndefined();
        });

        it('returns undefined for missing value', () => {
            const config = InstantDescriptor.readConfig({default: [{}]});

            expect(config.default).toBeUndefined();
        });

        describe('relative expressions', () => {
            beforeEach(() => {
                vi.useFakeTimers();
                vi.setSystemTime(new Date('2025-06-15T14:30:00Z'));
            });

            afterEach(() => {
                vi.useRealTimers();
            });

            it('parses "now" as current datetime', () => {
                const config = InstantDescriptor.readConfig({default: [{value: 'now'}]});

                expect(config.default).toBeInstanceOf(Date);
            });

            it('parses relative offset "+1year -12hours"', () => {
                const config = InstantDescriptor.readConfig({default: [{value: '+1year -12hours'}]});

                expect(config.default).toBeInstanceOf(Date);
            });

            it('returns undefined for invalid relative expression', () => {
                const config = InstantDescriptor.readConfig({default: [{value: 'invalid-expr'}]});

                expect(config.default).toBeUndefined();
            });
        });
    });

    describe('createDefaultValue', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2025-06-15T14:30:00Z'));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('creates DATE_TIME value from valid instant string', () => {
            const value = InstantDescriptor.createDefaultValue('2025-06-15T14:30:00Z');

            expect(value).toBeInstanceOf(Value);
            expect(value.isNull()).toBe(false);
            expect(value.getType()).toBe(ValueTypes.DATE_TIME);
        });

        it('creates value from naive datetime by converting local time to UTC', () => {
            const input = '2025-06-15T14:30';
            const value = InstantDescriptor.createDefaultValue(input);
            // ? new Date() parses naive datetime as local time per JS spec
            const expected = new Date(input).toISOString().replace(/\.000Z$/, 'Z');

            expect(value.isNull()).toBe(false);
            expect(value.getType()).toBe(ValueTypes.DATE_TIME);
            expect(value.getString()).toBe(expected);
        });

        it('creates value from naive datetime with seconds by converting local time to UTC', () => {
            const input = '2025-06-15T14:30:45';
            const value = InstantDescriptor.createDefaultValue(input);
            const expected = new Date(input).toISOString().replace(/\.000Z$/, 'Z');

            expect(value.isNull()).toBe(false);
            expect(value.getType()).toBe(ValueTypes.DATE_TIME);
            expect(value.getString()).toBe(expected);
        });

        it('creates value from instant with seconds', () => {
            const value = InstantDescriptor.createDefaultValue('2025-06-15T14:30:45Z');

            expect(value.isNull()).toBe(false);
            expect(value.getType()).toBe(ValueTypes.DATE_TIME);
        });

        it('converts positive offset to UTC', () => {
            const value = InstantDescriptor.createDefaultValue('2000-01-01T12:30+01:00');

            expect(value.isNull()).toBe(false);
            expect(value.getString()).toBe('2000-01-01T11:30:00Z');
        });

        it('converts negative offset to UTC', () => {
            const value = InstantDescriptor.createDefaultValue('2025-06-15T08:00-05:00');

            expect(value.isNull()).toBe(false);
            expect(value.getString()).toBe('2025-06-15T13:00:00Z');
        });

        it('converts +00:00 offset to Z', () => {
            const value = InstantDescriptor.createDefaultValue('2025-06-15T14:30+00:00');

            expect(value.isNull()).toBe(false);
            expect(value.getString()).toBe('2025-06-15T14:30:00Z');
        });

        it('converts half-hour offset to UTC', () => {
            const value = InstantDescriptor.createDefaultValue('2025-06-15T18:00+05:30');

            expect(value.isNull()).toBe(false);
            expect(value.getString()).toBe('2025-06-15T12:30:00Z');
        });

        it('converts offset with seconds to UTC', () => {
            const value = InstantDescriptor.createDefaultValue('2025-06-15T14:30:45+02:00');

            expect(value.isNull()).toBe(false);
            expect(value.getString()).toBe('2025-06-15T12:30:45Z');
        });

        it('creates value from relative expression "now"', () => {
            const value = InstantDescriptor.createDefaultValue('now');

            expect(value.isNull()).toBe(false);
            expect(value.getType()).toBe(ValueTypes.DATE_TIME);
        });

        it('creates value from relative expression "+1d"', () => {
            const value = InstantDescriptor.createDefaultValue('+1d');

            expect(value.isNull()).toBe(false);
            expect(value.getType()).toBe(ValueTypes.DATE_TIME);
        });

        it('returns null Value for date-only string', () => {
            const value = InstantDescriptor.createDefaultValue('2025-06-15');

            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for display format with space', () => {
            const value = InstantDescriptor.createDefaultValue('2025-06-15 14:30');

            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for non-datetime non-relative string', () => {
            const value = InstantDescriptor.createDefaultValue('garbage');

            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for number input', () => {
            const value = InstantDescriptor.createDefaultValue(42);

            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for null input', () => {
            const value = InstantDescriptor.createDefaultValue(null);

            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for undefined input', () => {
            const value = InstantDescriptor.createDefaultValue(undefined);

            expect(value.isNull()).toBe(true);
        });
    });

    describe('validate', () => {
        const config: InstantConfig = {default: undefined};

        it('returns empty for null value with no rawValue', () => {
            const value = ValueTypes.DATE_TIME.newNullValue();

            expect(InstantDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns error for null value with non-empty rawValue', () => {
            const value = ValueTypes.DATE_TIME.newNullValue();

            const results = InstantDescriptor.validate(value, config, '2025-06-15T');

            expect(results).toHaveLength(1);
        });

        it('returns empty for null value with empty rawValue', () => {
            const value = ValueTypes.DATE_TIME.newNullValue();

            expect(InstantDescriptor.validate(value, config, '')).toEqual([]);
        });

        it('returns empty for valid instant', () => {
            const value = ValueTypes.DATE_TIME.newValue('2025-06-15T14:30:00Z');

            expect(InstantDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns empty for valid instant with fractions', () => {
            const value = ValueTypes.DATE_TIME.newValue('2025-06-15T14:30:45.123Z');

            expect(InstantDescriptor.validate(value, config)).toEqual([]);
        });
    });

    describe('valueBreaksRequired', () => {
        it('returns true for null value', () => {
            const value = ValueTypes.DATE_TIME.newNullValue();

            expect(InstantDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns true for wrong ValueType', () => {
            const value = ValueTypes.STRING.newValue('2025-06-15T14:30:00Z');

            expect(InstantDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns false for valid datetime value', () => {
            const value = ValueTypes.DATE_TIME.newValue('2025-06-15T14:30:00Z');

            expect(InstantDescriptor.valueBreaksRequired(value)).toBe(false);
        });
    });

    describe('readConfig → validate integration', () => {
        it('accepts valid instant with default config', () => {
            const config = InstantDescriptor.readConfig({});
            const value = ValueTypes.DATE_TIME.newValue('2025-12-31T23:59:00Z');

            expect(InstantDescriptor.validate(value, config)).toEqual([]);
        });

        it('accepts null value with default config', () => {
            const config = InstantDescriptor.readConfig({});
            const value = ValueTypes.DATE_TIME.newNullValue();

            expect(InstantDescriptor.validate(value, config)).toEqual([]);
        });
    });
});
