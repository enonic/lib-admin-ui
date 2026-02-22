import {describe, expect, it, vi} from 'vitest';
import {Value} from '../../main/resources/assets/admin/common/js/data/Value';
import {ValueTypes} from '../../main/resources/assets/admin/common/js/data/ValueTypes';
import type {TextLineConfig} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/InputTypeConfig';
import type {ValidationResult} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/ValidationResult';
import {getCounterDescription} from '../../main/resources/assets/admin/common/js/form/inputtype2/TextLineInput';
import {getFirstError} from '../../main/resources/assets/admin/common/js/form/inputtype2/types';

vi.mock('@enonic/ui', () => ({Input: () => null}));
vi.mock('../../main/resources/assets/admin/common/js/util/Messages', () => ({
    i18n: (key: string, ..._args: unknown[]) => `#${key}#`,
}));

function makeConfig(overrides: Partial<TextLineConfig> = {}): TextLineConfig {
    return {regexp: null, maxLength: -1, showCounter: false, ...overrides};
}

describe('getFirstError', () => {
    it('returns undefined for empty array', () => {
        expect(getFirstError([])).toBeUndefined();
    });

    it('returns first message for single error', () => {
        const errors: ValidationResult[] = [{message: 'Too long'}];
        expect(getFirstError(errors)).toBe('Too long');
    });

    it('returns first message for multiple errors', () => {
        const errors: ValidationResult[] = [{message: 'First error'}, {message: 'Second error'}];
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

describe('getCounterDescription', () => {
    it('returns undefined when no counter and no maxLength', () => {
        expect(getCounterDescription(5, makeConfig())).toBeUndefined();
    });

    it('returns total + remaining when showCounter and maxLength', () => {
        const result = getCounterDescription(13, makeConfig({maxLength: 50, showCounter: true}));
        expect(result).toContain('field.value.chars.total');
        expect(result).toContain('field.value.chars.left.short');
    });

    it('returns remaining only when maxLength without showCounter', () => {
        const result = getCounterDescription(5, makeConfig({maxLength: 20}));
        expect(result).toContain('field.value.chars.left.long');
    });

    it('returns total only when showCounter without maxLength', () => {
        const result = getCounterDescription(10, makeConfig({showCounter: true}));
        expect(result).toContain('field.value.chars.total');
        expect(result).not.toContain('field.value.chars.left');
    });

    it('handles zero length', () => {
        const result = getCounterDescription(0, makeConfig({maxLength: 50, showCounter: true}));
        expect(result).toBeDefined();
    });

    it('handles length at max', () => {
        const result = getCounterDescription(50, makeConfig({maxLength: 50}));
        expect(result).toContain('field.value.chars.left.long');
    });
});
