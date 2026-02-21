import {describe, expect, it, vi} from 'vitest';
import {Value} from '../../main/resources/assets/admin/common/js/data/Value';
import {ValueTypes} from '../../main/resources/assets/admin/common/js/data/ValueTypes';
import {getFirstError} from '../../main/resources/assets/admin/common/js/form/inputtype2/types';
import type {ValidationResult} from '../../main/resources/assets/admin/common/js/form/inputtype/descriptor/ValidationResult';

vi.mock('../../main/resources/assets/admin/common/js/util/Messages', () => ({
    i18n: (key: string, ...args: unknown[]) => `#${key}#`,
}));

describe('getFirstError', () => {

    it('returns undefined for empty array', () => {
        expect(getFirstError([])).toBeUndefined();
    });

    it('returns first message for single error', () => {
        const errors: ValidationResult[] = [{message: 'Too long'}];
        expect(getFirstError(errors)).toBe('Too long');
    });

    it('returns first message for multiple errors', () => {
        const errors: ValidationResult[] = [
            {message: 'First error'},
            {message: 'Second error'},
        ];
        expect(getFirstError(errors)).toBe('First error');
    });
});

describe('TextLineInput value transformation', () => {

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

    it('onChange produces correct Value type', () => {
        const newValue = ValueTypes.STRING.newValue('test input');
        expect(newValue).toBeInstanceOf(Value);
        expect(newValue.getString()).toBe('test input');
        expect(newValue.getType()).toBe(ValueTypes.STRING);
    });
});
