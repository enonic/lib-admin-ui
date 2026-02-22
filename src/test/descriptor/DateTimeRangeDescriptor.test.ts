import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {PropertyTree} from '../../main/resources/assets/admin/common/js/data/PropertyTree';
import {Value} from '../../main/resources/assets/admin/common/js/data/Value';
import {ValueTypes} from '../../main/resources/assets/admin/common/js/data/ValueTypes';
import {DateTimeRangeDescriptor} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/DateTimeRangeDescriptor';
import type {DateTimeRangeConfig} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/InputTypeConfig';
import {LocalDateTime} from '../../main/resources/assets/admin/common/js/util/LocalDateTime';

function makeRangeValue(from?: string | null, to?: string | null): Value {
    const tree = new PropertyTree();
    const pSet = tree.getRoot();
    if (from) {
        pSet.addLocalDateTime('from', LocalDateTime.fromString(from));
    }
    if (to) {
        pSet.addLocalDateTime('to', LocalDateTime.fromString(to));
    }
    return new Value(pSet, ValueTypes.DATA);
}

function makeDefaultConfig(overrides: Partial<DateTimeRangeConfig> = {}): DateTimeRangeConfig {
    return {
        useTimezone: false,
        fromLabel: 'Date from',
        toLabel: 'Date to',
        errorNoStart: 'Date from is required when Date to is set',
        errorEndInPast: 'Date to cannot be in the past',
        errorEndBeforeStart: 'Date to cannot be before Date from',
        errorStartEqualsEnd: 'Date from and Date to cannot be equal',
        defaultFromTime: null,
        defaultToTime: null,
        fromPlaceholder: '',
        toPlaceholder: '',
        optionalFrom: false,
        ...overrides,
    };
}

describe('DateTimeRangeDescriptor', () => {
    describe('getValueType', () => {
        it('returns DATA', () => {
            expect(DateTimeRangeDescriptor.getValueType()).toBe(ValueTypes.DATA);
        });
    });

    describe('readConfig', () => {
        it('returns all defaults with empty config', () => {
            const config = DateTimeRangeDescriptor.readConfig({});
            expect(config.useTimezone).toBe(false);
            expect(config.fromLabel).toBe('Date from');
            expect(config.toLabel).toBe('Date to');
            expect(config.errorNoStart).toBe('Date from is required when Date to is set');
            expect(config.errorEndInPast).toBe('Date to cannot be in the past');
            expect(config.errorEndBeforeStart).toBe('Date to cannot be before Date from');
            expect(config.errorStartEqualsEnd).toBe('Date from and Date to cannot be equal');
            expect(config.defaultFromTime).toBeNull();
            expect(config.defaultToTime).toBeNull();
            expect(config.fromPlaceholder).toBe('');
            expect(config.toPlaceholder).toBe('');
            expect(config.optionalFrom).toBe(false);
        });

        it('parses timezone', () => {
            const config = DateTimeRangeDescriptor.readConfig({
                timezone: [{value: 'true'}],
            });
            expect(config.useTimezone).toBe(true);
        });

        it('parses custom labels', () => {
            const config = DateTimeRangeDescriptor.readConfig({
                fromLabel: [{value: 'Start'}],
                toLabel: [{value: 'End'}],
            });
            expect(config.fromLabel).toBe('Start');
            expect(config.toLabel).toBe('End');
        });

        it('builds error messages from custom labels', () => {
            const config = DateTimeRangeDescriptor.readConfig({
                fromLabel: [{value: 'Start'}],
                toLabel: [{value: 'End'}],
            });
            expect(config.errorNoStart).toBe('Start is required when End is set');
            expect(config.errorEndBeforeStart).toBe('End cannot be before Start');
            expect(config.errorStartEqualsEnd).toBe('Start and End cannot be equal');
        });

        it('parses custom error messages (override auto-generated)', () => {
            const config = DateTimeRangeDescriptor.readConfig({
                errorNoStart: [{value: 'Custom no start'}],
                errorEndInPast: [{value: 'Custom end past'}],
            });
            expect(config.errorNoStart).toBe('Custom no start');
            expect(config.errorEndInPast).toBe('Custom end past');
        });

        it('parses defaultFromTime', () => {
            const config = DateTimeRangeDescriptor.readConfig({
                defaultFromTime: [{value: '09:00'}],
            });
            expect(config.defaultFromTime).toEqual({hours: 9, minutes: 0});
        });

        it('parses defaultToTime', () => {
            const config = DateTimeRangeDescriptor.readConfig({
                defaultToTime: [{value: '17:30'}],
            });
            expect(config.defaultToTime).toEqual({hours: 17, minutes: 30});
        });

        it('handles missing time values as null', () => {
            const config = DateTimeRangeDescriptor.readConfig({});
            expect(config.defaultFromTime).toBeNull();
            expect(config.defaultToTime).toBeNull();
        });

        it('parses placeholders', () => {
            const config = DateTimeRangeDescriptor.readConfig({
                fromPlaceholder: [{value: 'Enter start'}],
                toPlaceholder: [{value: 'Enter end'}],
            });
            expect(config.fromPlaceholder).toBe('Enter start');
            expect(config.toPlaceholder).toBe('Enter end');
        });

        it('parses optionalFrom as boolean', () => {
            const config = DateTimeRangeDescriptor.readConfig({
                optionalFrom: [{value: 'true'}],
            });
            expect(config.optionalFrom).toBe(true);
        });

        it('optionalFrom is false for empty string', () => {
            const config = DateTimeRangeDescriptor.readConfig({
                optionalFrom: [{value: ''}],
            });
            expect(config.optionalFrom).toBe(false);
        });
    });

    describe('createDefaultValue', () => {
        it('always returns null DATA value', () => {
            const value = DateTimeRangeDescriptor.createDefaultValue('anything');
            expect(value).toBeInstanceOf(Value);
            expect(value.isNull()).toBe(true);
        });

        it('returns null for null input', () => {
            const value = DateTimeRangeDescriptor.createDefaultValue(null);
            expect(value.isNull()).toBe(true);
        });

        it('returns null for undefined input', () => {
            const value = DateTimeRangeDescriptor.createDefaultValue(undefined);
            expect(value.isNull()).toBe(true);
        });
    });

    describe('validate', () => {
        const NOW = new Date('2025-06-15T12:00:00');

        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(NOW);
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('returns empty for null value', () => {
            const config = makeDefaultConfig();
            const value = ValueTypes.DATA.newNullValue();
            expect(DateTimeRangeDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns error for wrong value type', () => {
            const config = makeDefaultConfig();
            const value = ValueTypes.STRING.newValue('not-a-range');
            const results = DateTimeRangeDescriptor.validate(value, config);
            expect(results).toHaveLength(1);
            expect(results[0].message).toBe('Value is not a valid date-time range');
        });

        it('returns empty for valid range (from < to, both in future)', () => {
            const config = makeDefaultConfig();
            const value = makeRangeValue('2025-07-01T10:00', '2025-07-01T18:00');
            expect(DateTimeRangeDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns errorNoStart when to is set but from is missing (optionalFrom=false)', () => {
            const config = makeDefaultConfig({optionalFrom: false});
            const value = makeRangeValue(null, '2025-07-01T18:00');
            const results = DateTimeRangeDescriptor.validate(value, config);
            expect(results).toHaveLength(1);
            expect(results[0].message).toBe('Date from is required when Date to is set');
        });

        it('does not return errorNoStart when optionalFrom=true', () => {
            const config = makeDefaultConfig({optionalFrom: true});
            const value = makeRangeValue(null, '2025-07-01T18:00');
            const results = DateTimeRangeDescriptor.validate(value, config);
            // Should not have the "no start" error
            const noStartErrors = results.filter(r => r.message === config.errorNoStart);
            expect(noStartErrors).toHaveLength(0);
        });

        it('returns errorEndInPast when to is in the past', () => {
            const config = makeDefaultConfig();
            const value = makeRangeValue('2025-01-01T10:00', '2025-01-01T18:00');
            const results = DateTimeRangeDescriptor.validate(value, config);
            expect(results).toHaveLength(1);
            expect(results[0].message).toBe('Date to cannot be in the past');
        });

        it('returns errorEndBeforeStart when to < from (both in future)', () => {
            const config = makeDefaultConfig();
            const value = makeRangeValue('2025-07-10T18:00', '2025-07-10T10:00');
            const results = DateTimeRangeDescriptor.validate(value, config);
            expect(results).toHaveLength(1);
            expect(results[0].message).toBe('Date to cannot be before Date from');
        });

        it('returns errorStartEqualsEnd when from equals to', () => {
            const config = makeDefaultConfig();
            const value = makeRangeValue('2025-07-01T10:00', '2025-07-01T10:00');
            const results = DateTimeRangeDescriptor.validate(value, config);
            expect(results).toHaveLength(1);
            expect(results[0].message).toBe('Date from and Date to cannot be equal');
        });

        it('returns empty when only from is set (no to)', () => {
            const config = makeDefaultConfig();
            const value = makeRangeValue('2025-07-01T10:00', null);
            expect(DateTimeRangeDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns empty for empty property set', () => {
            const config = makeDefaultConfig();
            const value = makeRangeValue(null, null);
            expect(DateTimeRangeDescriptor.validate(value, config)).toEqual([]);
        });
    });

    describe('valueBreaksRequired', () => {
        it('returns true for null value', () => {
            const value = ValueTypes.DATA.newNullValue();
            expect(DateTimeRangeDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns true for wrong value type', () => {
            const value = ValueTypes.STRING.newValue('not-a-range');
            expect(DateTimeRangeDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns false for valid range with LocalDateTime properties', () => {
            const value = makeRangeValue('2025-07-01T10:00', '2025-07-01T18:00');
            expect(DateTimeRangeDescriptor.valueBreaksRequired(value)).toBe(false);
        });

        it('returns false for empty property set (no from/to properties)', () => {
            const value = makeRangeValue(null, null);
            expect(DateTimeRangeDescriptor.valueBreaksRequired(value)).toBe(false);
        });

        it('returns false for only from set', () => {
            const value = makeRangeValue('2025-07-01T10:00', null);
            expect(DateTimeRangeDescriptor.valueBreaksRequired(value)).toBe(false);
        });

        it('returns false for only to set', () => {
            const value = makeRangeValue(null, '2025-07-01T18:00');
            expect(DateTimeRangeDescriptor.valueBreaksRequired(value)).toBe(false);
        });

        it('returns true when from property has wrong type', () => {
            const tree = new PropertyTree();
            const pSet = tree.getRoot();
            pSet.addString('from', 'not-a-datetime');
            const value = new Value(pSet, ValueTypes.DATA);
            expect(DateTimeRangeDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns true when to property has wrong type', () => {
            const tree = new PropertyTree();
            const pSet = tree.getRoot();
            pSet.addString('to', 'not-a-datetime');
            const value = new Value(pSet, ValueTypes.DATA);
            expect(DateTimeRangeDescriptor.valueBreaksRequired(value)).toBe(true);
        });
    });

    describe('readConfig → validate integration', () => {
        const NOW = new Date('2025-06-15T12:00:00');

        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(NOW);
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('validates valid range with default config', () => {
            const config = DateTimeRangeDescriptor.readConfig({});
            const value = makeRangeValue('2025-07-01T10:00', '2025-07-01T18:00');
            expect(DateTimeRangeDescriptor.validate(value, config)).toEqual([]);
        });

        it('uses custom error messages from config', () => {
            const config = DateTimeRangeDescriptor.readConfig({
                errorNoStart: [{value: 'Need a start date!'}],
            });
            const value = makeRangeValue(null, '2025-07-01T18:00');
            const results = DateTimeRangeDescriptor.validate(value, config);
            expect(results).toHaveLength(1);
            expect(results[0].message).toBe('Need a start date!');
        });

        it('respects optionalFrom from config', () => {
            const config = DateTimeRangeDescriptor.readConfig({
                optionalFrom: [{value: 'true'}],
            });
            const value = makeRangeValue(null, '2025-07-01T18:00');
            const results = DateTimeRangeDescriptor.validate(value, config);
            const noStartErrors = results.filter(r => r.message.includes('required'));
            expect(noStartErrors).toHaveLength(0);
        });
    });
});
