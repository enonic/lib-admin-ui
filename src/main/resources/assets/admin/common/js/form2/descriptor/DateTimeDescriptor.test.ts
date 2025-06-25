import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {Value} from '../../data/Value';
import {ValueTypes} from '../../data/ValueTypes';
import {DateTimeDescriptor} from './DateTimeDescriptor';
import type {DateTimeConfig} from './InputTypeConfig';

vi.mock('../../util/Messages', () => ({
    i18n: (key: string, ..._args: unknown[]) => `#${key}#`,
}));

describe('DateTimeDescriptor', () => {
    describe('getValueType', () => {
        it('returns LOCAL_DATE_TIME', () => {
            expect(DateTimeDescriptor.getValueType()).toBe(ValueTypes.LOCAL_DATE_TIME);
        });
    });

    describe('readConfig', () => {
        it('returns default undefined by default', () => {
            const config = DateTimeDescriptor.readConfig({});

            expect(config.default).toBeUndefined();
        });

        it('ignores unknown config keys', () => {
            const config = DateTimeDescriptor.readConfig({unknown: [{value: 'test'}]});

            expect(config.default).toBeUndefined();
        });

        it('parses absolute datetime without timezone', () => {
            const config = DateTimeDescriptor.readConfig({default: [{value: '2025-06-15T14:30'}]});

            expect(config.default).toBeInstanceOf(Date);
            expect(config.default?.getFullYear()).toBe(2025);
            expect(config.default?.getMonth()).toBe(5);
            expect(config.default?.getDate()).toBe(15);
            expect(config.default?.getHours()).toBe(14);
            expect(config.default?.getMinutes()).toBe(30);
        });

        it('parses absolute datetime with seconds', () => {
            const config = DateTimeDescriptor.readConfig({default: [{value: '2025-06-15T14:30:45'}]});

            expect(config.default).toBeInstanceOf(Date);
        });

        it('ignores datetime with timezone (handled by separate input type)', () => {
            const config = DateTimeDescriptor.readConfig({default: [{value: '2016-12-31T23:59+01:00'}]});

            expect(config.default).toBeUndefined();
        });

        it('returns undefined for invalid datetime format', () => {
            const config = DateTimeDescriptor.readConfig({default: [{value: 'not-a-datetime'}]});

            expect(config.default).toBeUndefined();
        });

        it('returns undefined for empty string', () => {
            const config = DateTimeDescriptor.readConfig({default: [{value: ''}]});

            expect(config.default).toBeUndefined();
        });

        it('returns undefined for missing value', () => {
            const config = DateTimeDescriptor.readConfig({default: [{}]});

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

            it('parses "now" as current datetime', () => {
                const config = DateTimeDescriptor.readConfig({default: [{value: 'now'}]});

                expect(config.default).toBeInstanceOf(Date);
            });

            it('parses relative offset "+1year -12hours"', () => {
                const config = DateTimeDescriptor.readConfig({default: [{value: '+1year -12hours'}]});

                expect(config.default).toBeInstanceOf(Date);
            });

            it('returns undefined for invalid relative expression', () => {
                const config = DateTimeDescriptor.readConfig({default: [{value: 'invalid-expr'}]});

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

        it('creates LOCAL_DATE_TIME value from valid datetime string', () => {
            const value = DateTimeDescriptor.createDefaultValue('2025-06-15T14:30');

            expect(value).toBeInstanceOf(Value);
            expect(value.isNull()).toBe(false);
            expect(value.getType()).toBe(ValueTypes.LOCAL_DATE_TIME);
        });

        it('creates value from datetime with seconds', () => {
            const value = DateTimeDescriptor.createDefaultValue('2025-06-15T14:30:45');

            expect(value.isNull()).toBe(false);
            expect(value.getType()).toBe(ValueTypes.LOCAL_DATE_TIME);
        });

        it('creates value from datetime with fractions', () => {
            const value = DateTimeDescriptor.createDefaultValue('2025-06-15T14:30:45.123');

            expect(value.isNull()).toBe(false);
            expect(value.getType()).toBe(ValueTypes.LOCAL_DATE_TIME);
        });

        it('creates value from relative expression "now"', () => {
            const value = DateTimeDescriptor.createDefaultValue('now');

            expect(value.isNull()).toBe(false);
            expect(value.getType()).toBe(ValueTypes.LOCAL_DATE_TIME);
        });

        it('creates value from relative expression "+1d"', () => {
            const value = DateTimeDescriptor.createDefaultValue('+1d');

            expect(value.isNull()).toBe(false);
            expect(value.getType()).toBe(ValueTypes.LOCAL_DATE_TIME);
        });

        it('returns null Value for non-datetime non-relative string', () => {
            const value = DateTimeDescriptor.createDefaultValue('garbage');

            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for number input', () => {
            const value = DateTimeDescriptor.createDefaultValue(42);

            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for null input', () => {
            const value = DateTimeDescriptor.createDefaultValue(null);

            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for undefined input', () => {
            const value = DateTimeDescriptor.createDefaultValue(undefined);

            expect(value.isNull()).toBe(true);
        });
    });

    describe('validate', () => {
        const config: DateTimeConfig = {default: undefined};

        it('returns empty for null value with no rawValue', () => {
            const value = ValueTypes.LOCAL_DATE_TIME.newNullValue();

            // Act & Assert
            expect(DateTimeDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns error for null value with non-empty rawValue', () => {
            const value = ValueTypes.LOCAL_DATE_TIME.newNullValue();

            const results = DateTimeDescriptor.validate(value, config, '2025-06-15T');

            expect(results).toHaveLength(1);
        });

        it('returns empty for null value with empty rawValue', () => {
            const value = ValueTypes.LOCAL_DATE_TIME.newNullValue();

            // Act & Assert
            expect(DateTimeDescriptor.validate(value, config, '')).toEqual([]);
        });

        it('returns empty for valid datetime without seconds', () => {
            const value = ValueTypes.LOCAL_DATE_TIME.newValue('2025-06-15T14:30');

            // Act & Assert
            expect(DateTimeDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns empty for valid datetime with seconds', () => {
            const value = ValueTypes.LOCAL_DATE_TIME.newValue('2025-06-15T14:30:45');

            // Act & Assert
            expect(DateTimeDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns empty for valid datetime with fractions', () => {
            const value = ValueTypes.LOCAL_DATE_TIME.newValue('2025-06-15T14:30:45.123');

            // Act & Assert
            expect(DateTimeDescriptor.validate(value, config)).toEqual([]);
        });
    });

    describe('valueBreaksRequired', () => {
        it('returns true for null value', () => {
            const value = ValueTypes.LOCAL_DATE_TIME.newNullValue();

            // Act & Assert
            expect(DateTimeDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns true for wrong ValueType', () => {
            const value = ValueTypes.STRING.newValue('2025-06-15T14:30');

            // Act & Assert
            expect(DateTimeDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns false for valid local datetime value', () => {
            const value = ValueTypes.LOCAL_DATE_TIME.newValue('2025-06-15T14:30');

            // Act & Assert
            expect(DateTimeDescriptor.valueBreaksRequired(value)).toBe(false);
        });
    });

    describe('readConfig → validate integration', () => {
        it('accepts valid datetime with default config', () => {
            const config = DateTimeDescriptor.readConfig({});
            const value = ValueTypes.LOCAL_DATE_TIME.newValue('2025-12-31T23:59');

            // Act & Assert
            expect(DateTimeDescriptor.validate(value, config)).toEqual([]);
        });

        it('accepts null value with default config', () => {
            const config = DateTimeDescriptor.readConfig({});
            const value = ValueTypes.LOCAL_DATE_TIME.newNullValue();

            // Act & Assert
            expect(DateTimeDescriptor.validate(value, config)).toEqual([]);
        });
    });
});
