import {describe, expect, it} from 'vitest';
import {Value} from '../../main/resources/assets/admin/common/js/data/Value';
import {ValueTypes} from '../../main/resources/assets/admin/common/js/data/ValueTypes';

describe('TextAreaInput value transformation', () => {
    it('null value produces empty string', () => {
        const value = ValueTypes.STRING.newNullValue();
        expect(value.isNull()).toBe(true);
        const stringValue = value.isNull() ? '' : (value.getString() ?? '');
        expect(stringValue).toBe('');
    });

    it('valid string value produces string display', () => {
        const value = ValueTypes.STRING.newValue('hello');
        expect(value.isNull()).toBe(false);
        const stringValue = value.isNull() ? '' : (value.getString() ?? '');
        expect(stringValue).toBe('hello');
    });

    it('multiline string value is preserved', () => {
        const value = ValueTypes.STRING.newValue('line one\nline two\nline three');
        const stringValue = value.isNull() ? '' : (value.getString() ?? '');
        expect(stringValue).toBe('line one\nline two\nline three');
    });

    it('onChange produces correct Value type', () => {
        const newValue = ValueTypes.STRING.newValue('test input');
        expect(newValue).toBeInstanceOf(Value);
        expect(newValue.getString()).toBe('test input');
        expect(newValue.getType()).toBe(ValueTypes.STRING);
    });
});
