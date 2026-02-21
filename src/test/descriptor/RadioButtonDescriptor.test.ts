import {describe, expect, it} from 'vitest';
import {Value} from '../../main/resources/assets/admin/common/js/data/Value';
import {ValueTypes} from '../../main/resources/assets/admin/common/js/data/ValueTypes';
import {RadioButtonDescriptor} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/RadioButtonDescriptor';
import {RadioButtonConfig} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/InputTypeConfig';

describe('RadioButtonDescriptor', () => {

    describe('getValueType', () => {
        it('returns STRING', () => {
            expect(RadioButtonDescriptor.getValueType()).toBe(ValueTypes.STRING);
        });
    });

    describe('readConfig', () => {
        it('parses options with label and value', () => {
            const config = RadioButtonDescriptor.readConfig({
                'options': [
                    {'value': 'Yes', '@value': 'yes'},
                    {'value': 'No', '@value': 'no'},
                ],
            });
            expect(config.options).toHaveLength(2);
            expect(config.options[0]).toEqual({label: 'Yes', value: 'yes'});
            expect(config.options[1]).toEqual({label: 'No', value: 'no'});
        });

        it('handles empty options array', () => {
            const config = RadioButtonDescriptor.readConfig({'options': []});
            expect(config.options).toEqual([]);
        });

        it('handles missing options key', () => {
            const config = RadioButtonDescriptor.readConfig({});
            expect(config.options).toEqual([]);
        });

        it('parses single option', () => {
            const config = RadioButtonDescriptor.readConfig({
                'options': [{'value': 'Only', '@value': 'only'}],
            });
            expect(config.options).toHaveLength(1);
            expect(config.options[0].value).toBe('only');
        });
    });

    describe('createDefaultValue', () => {
        it('creates STRING value from string input', () => {
            const value = RadioButtonDescriptor.createDefaultValue('yes');
            expect(value).toBeInstanceOf(Value);
            expect(value.isNull()).toBe(false);
            expect(value.getString()).toBe('yes');
            expect(value.getType()).toBe(ValueTypes.STRING);
        });

        it('returns null Value for number input', () => {
            const value = RadioButtonDescriptor.createDefaultValue(42);
            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for null input', () => {
            const value = RadioButtonDescriptor.createDefaultValue(null);
            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for undefined input', () => {
            const value = RadioButtonDescriptor.createDefaultValue(undefined);
            expect(value.isNull()).toBe(true);
        });
    });

    describe('validate', () => {
        const options: RadioButtonConfig = {
            options: [
                {label: 'Yes', value: 'yes'},
                {label: 'No', value: 'no'},
            ],
        };

        it('returns empty array for valid option', () => {
            const value = ValueTypes.STRING.newValue('yes');
            expect(RadioButtonDescriptor.validate(value, options)).toEqual([]);
        });

        it('detects value not in allowed options', () => {
            const value = ValueTypes.STRING.newValue('maybe');
            const results = RadioButtonDescriptor.validate(value, options);
            expect(results).toHaveLength(1);
            expect(results[0].message).toBe('Value is not one of the allowed options');
        });

        it('validates against @value, not label', () => {
            const value = ValueTypes.STRING.newValue('Yes');
            const results = RadioButtonDescriptor.validate(value, options);
            expect(results).toHaveLength(1);
        });

        it('returns empty for null value', () => {
            const value = ValueTypes.STRING.newNullValue();
            expect(RadioButtonDescriptor.validate(value, options)).toEqual([]);
        });

        it('rejects value when options list is empty and value is not null', () => {
            const config: RadioButtonConfig = {options: []};
            const value = ValueTypes.STRING.newValue('anything');
            const results = RadioButtonDescriptor.validate(value, config);
            expect(results).toHaveLength(1);
        });
    });

    describe('valueBreaksRequired', () => {
        it('returns true for null value', () => {
            const value = ValueTypes.STRING.newNullValue();
            expect(RadioButtonDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns true for wrong ValueType', () => {
            const value = ValueTypes.LONG.newValue('42');
            expect(RadioButtonDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns false for valid string value', () => {
            const value = ValueTypes.STRING.newValue('yes');
            expect(RadioButtonDescriptor.valueBreaksRequired(value)).toBe(false);
        });
    });

    describe('readConfig → validate integration', () => {
        it('accepts value matching parsed @value', () => {
            const config = RadioButtonDescriptor.readConfig({
                'options': [{'value': 'Label', '@value': 'key1'}],
            });
            const results = RadioButtonDescriptor.validate(ValueTypes.STRING.newValue('key1'), config);
            expect(results).toEqual([]);
        });

        it('rejects value not in parsed options', () => {
            const config = RadioButtonDescriptor.readConfig({
                'options': [{'value': 'Label', '@value': 'key1'}],
            });
            const results = RadioButtonDescriptor.validate(ValueTypes.STRING.newValue('key2'), config);
            expect(results).toHaveLength(1);
        });

        it('handles empty config options gracefully', () => {
            const config = RadioButtonDescriptor.readConfig({});
            const results = RadioButtonDescriptor.validate(ValueTypes.STRING.newNullValue(), config);
            expect(results).toEqual([]);
        });
    });
});
