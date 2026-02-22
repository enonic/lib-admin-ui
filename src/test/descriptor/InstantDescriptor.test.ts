import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {Value} from '../../main/resources/assets/admin/common/js/data/Value';
import {ValueTypes} from '../../main/resources/assets/admin/common/js/data/ValueTypes';
import type {InstantConfig} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/InputTypeConfig';
import {InstantDescriptor} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/InstantDescriptor';

describe('InstantDescriptor', () => {
    describe('getValueType', () => {
        it('returns INSTANT', () => {
            expect(InstantDescriptor.getValueType()).toBe(ValueTypes.INSTANT);
        });
    });

    describe('readConfig', () => {
        it('returns empty config object', () => {
            const config = InstantDescriptor.readConfig({});
            expect(config).toEqual({});
        });

        it('ignores unknown config keys', () => {
            const config = InstantDescriptor.readConfig({unknown: [{value: 'test'}]});
            expect(config).toEqual({});
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

        it('creates INSTANT value from valid instant string with Z', () => {
            const value = InstantDescriptor.createDefaultValue('2025-06-15T14:30:00Z');
            expect(value).toBeInstanceOf(Value);
            expect(value.isNull()).toBe(false);
            expect(value.getType()).toBe(ValueTypes.INSTANT);
        });

        it('creates INSTANT value from instant with seconds and Z', () => {
            const value = InstantDescriptor.createDefaultValue('2025-06-15T14:30:45Z');
            expect(value.isNull()).toBe(false);
            expect(value.getType()).toBe(ValueTypes.INSTANT);
        });

        it('creates value from relative expression "now"', () => {
            const value = InstantDescriptor.createDefaultValue('now');
            expect(value.isNull()).toBe(false);
            expect(value.getType()).toBe(ValueTypes.INSTANT);
        });

        it('falls back to relative parse for DateTime without Z', () => {
            const value = InstantDescriptor.createDefaultValue('2025-06-15T14:30:00');
            expect(value.isNull()).toBe(false);
            expect(value.getType()).toBe(ValueTypes.INSTANT);
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
        const config: InstantConfig = {};

        it('returns empty for null value', () => {
            const value = ValueTypes.INSTANT.newNullValue();
            expect(InstantDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns empty for valid instant with Z', () => {
            const value = ValueTypes.INSTANT.newValue('2025-06-15T14:30:00Z');
            expect(InstantDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns empty for instant with fractions and Z', () => {
            const value = ValueTypes.INSTANT.newValue('2025-06-15T14:30:45.123Z');
            expect(InstantDescriptor.validate(value, config)).toEqual([]);
        });
    });

    describe('valueBreaksRequired', () => {
        it('returns true for null value', () => {
            const value = ValueTypes.INSTANT.newNullValue();
            expect(InstantDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns true for wrong ValueType', () => {
            const value = ValueTypes.STRING.newValue('2025-06-15T14:30:00Z');
            expect(InstantDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns false for valid instant value', () => {
            const value = ValueTypes.INSTANT.newValue('2025-06-15T14:30:00Z');
            expect(InstantDescriptor.valueBreaksRequired(value)).toBe(false);
        });
    });

    describe('readConfig → validate integration', () => {
        it('accepts valid instant with empty config', () => {
            const config = InstantDescriptor.readConfig({});
            const value = ValueTypes.INSTANT.newValue('2025-12-31T23:59:59Z');
            expect(InstantDescriptor.validate(value, config)).toEqual([]);
        });

        it('accepts null value with empty config', () => {
            const config = InstantDescriptor.readConfig({});
            const value = ValueTypes.INSTANT.newNullValue();
            expect(InstantDescriptor.validate(value, config)).toEqual([]);
        });
    });
});
