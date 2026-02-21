import {describe, expect, it} from 'vitest';
import {Value} from '../../main/resources/assets/admin/common/js/data/Value';
import {ValueTypes} from '../../main/resources/assets/admin/common/js/data/ValueTypes';
import {CheckboxDescriptor} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/CheckboxDescriptor';
import {CheckboxConfig} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/InputTypeConfig';

describe('CheckboxDescriptor', () => {

    describe('getValueType', () => {
        it('returns BOOLEAN', () => {
            expect(CheckboxDescriptor.getValueType()).toBe(ValueTypes.BOOLEAN);
        });
    });

    describe('readConfig', () => {
        it('parses alignment from config', () => {
            const config = CheckboxDescriptor.readConfig({'alignment': [{'value': 'RIGHT'}]});
            expect(config.alignment).toBe('RIGHT');
        });

        it('defaults alignment to LEFT when missing', () => {
            const config = CheckboxDescriptor.readConfig({});
            expect(config.alignment).toBe('LEFT');
        });

        it('defaults alignment to LEFT when value is empty string', () => {
            const config = CheckboxDescriptor.readConfig({'alignment': [{'value': ''}]});
            expect(config.alignment).toBe('LEFT');
        });

        it('defaults alignment to LEFT when entry has no value key', () => {
            const config = CheckboxDescriptor.readConfig({'alignment': [{}]});
            expect(config.alignment).toBe('LEFT');
        });
    });

    describe('createDefaultValue', () => {
        it('returns true for raw === "checked" (strict ===)', () => {
            const value = CheckboxDescriptor.createDefaultValue('checked');
            expect(value).toBeInstanceOf(Value);
            expect(value.isNull()).toBe(false);
            expect(value.getBoolean()).toBe(true);
        });

        it('returns false for raw === "unchecked"', () => {
            const value = CheckboxDescriptor.createDefaultValue('unchecked');
            expect(value.isNull()).toBe(false);
            expect(value.getBoolean()).toBe(false);
        });

        it('returns false for raw === true (boolean, not string)', () => {
            const value = CheckboxDescriptor.createDefaultValue(true);
            expect(value.getBoolean()).toBe(false);
        });

        it('returns false for null', () => {
            const value = CheckboxDescriptor.createDefaultValue(null);
            expect(value.getBoolean()).toBe(false);
        });

        it('returns false for undefined', () => {
            const value = CheckboxDescriptor.createDefaultValue(undefined);
            expect(value.getBoolean()).toBe(false);
        });

        it('returns false for empty string', () => {
            const value = CheckboxDescriptor.createDefaultValue('');
            expect(value.getBoolean()).toBe(false);
        });
    });

    describe('validate', () => {
        function makeConfig(overrides: Partial<CheckboxConfig> = {}): CheckboxConfig {
            return {alignment: 'LEFT', ...overrides};
        }

        it('always returns empty array for any value', () => {
            const config = makeConfig();
            const value = ValueTypes.BOOLEAN.fromJsonValue(true);
            expect(CheckboxDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns empty for false value', () => {
            const config = makeConfig();
            const value = ValueTypes.BOOLEAN.fromJsonValue(false);
            expect(CheckboxDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns empty for null value', () => {
            const config = makeConfig();
            const value = ValueTypes.BOOLEAN.newNullValue();
            expect(CheckboxDescriptor.validate(value, config)).toEqual([]);
        });
    });

    describe('valueBreaksRequired', () => {
        it('returns true for null value', () => {
            const value = ValueTypes.BOOLEAN.newNullValue();
            expect(CheckboxDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns true for wrong ValueType', () => {
            const value = ValueTypes.STRING.newValue('true');
            expect(CheckboxDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns false for boolean true', () => {
            const value = ValueTypes.BOOLEAN.fromJsonValue(true);
            expect(CheckboxDescriptor.valueBreaksRequired(value)).toBe(false);
        });

        it('returns false for boolean false', () => {
            const value = ValueTypes.BOOLEAN.fromJsonValue(false);
            expect(CheckboxDescriptor.valueBreaksRequired(value)).toBe(false);
        });
    });
});
