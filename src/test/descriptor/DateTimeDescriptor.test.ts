import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {Value} from '../../main/resources/assets/admin/common/js/data/Value';
import {ValueTypes} from '../../main/resources/assets/admin/common/js/data/ValueTypes';
import {DateTimeDescriptor} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/DateTimeDescriptor';
import {DateTimeConfig} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/InputTypeConfig';

describe('DateTimeDescriptor', () => {

    describe('getValueType', () => {
        it('returns LOCAL_DATE_TIME', () => {
            expect(DateTimeDescriptor.getValueType()).toBe(ValueTypes.LOCAL_DATE_TIME);
        });
    });

    describe('readConfig', () => {
        it('returns useTimezone: false by default', () => {
            const config = DateTimeDescriptor.readConfig({});
            expect(config.useTimezone).toBe(false);
        });

        it('ignores unknown config keys', () => {
            const config = DateTimeDescriptor.readConfig({'unknown': [{'value': 'test'}]});
            expect(config.useTimezone).toBe(false);
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
        const config: DateTimeConfig = {useTimezone: false};

        it('returns empty for null value', () => {
            const value = ValueTypes.LOCAL_DATE_TIME.newNullValue();
            expect(DateTimeDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns empty for valid datetime without seconds', () => {
            const value = ValueTypes.LOCAL_DATE_TIME.newValue('2025-06-15T14:30');
            expect(DateTimeDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns empty for valid datetime with seconds', () => {
            const value = ValueTypes.LOCAL_DATE_TIME.newValue('2025-06-15T14:30:45');
            expect(DateTimeDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns empty for valid datetime with fractions', () => {
            const value = ValueTypes.LOCAL_DATE_TIME.newValue('2025-06-15T14:30:45.123');
            expect(DateTimeDescriptor.validate(value, config)).toEqual([]);
        });
    });

    describe('valueBreaksRequired', () => {
        it('returns true for null value', () => {
            const value = ValueTypes.LOCAL_DATE_TIME.newNullValue();
            expect(DateTimeDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns true for wrong ValueType', () => {
            const value = ValueTypes.STRING.newValue('2025-06-15T14:30');
            expect(DateTimeDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns false for valid local datetime value', () => {
            const value = ValueTypes.LOCAL_DATE_TIME.newValue('2025-06-15T14:30');
            expect(DateTimeDescriptor.valueBreaksRequired(value)).toBe(false);
        });
    });

    describe('readConfig → validate integration', () => {
        it('accepts valid datetime with default config', () => {
            const config = DateTimeDescriptor.readConfig({});
            const value = ValueTypes.LOCAL_DATE_TIME.newValue('2025-12-31T23:59');
            expect(DateTimeDescriptor.validate(value, config)).toEqual([]);
        });

        it('accepts null value with default config', () => {
            const config = DateTimeDescriptor.readConfig({});
            const value = ValueTypes.LOCAL_DATE_TIME.newNullValue();
            expect(DateTimeDescriptor.validate(value, config)).toEqual([]);
        });
    });
});
