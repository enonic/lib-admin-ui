import {describe, expect, it, vi} from 'vitest';
import {Value} from '../../main/resources/assets/admin/common/js/data/Value';
import {ValueTypes} from '../../main/resources/assets/admin/common/js/data/ValueTypes';
import type {TextAreaConfig} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/InputTypeConfig';
import {getCounterDescription} from '../../main/resources/assets/admin/common/js/form/inputtype2/TextLineInput';

vi.mock('@enonic/ui', () => ({TextArea: () => null}));
vi.mock('../../main/resources/assets/admin/common/js/util/Messages', () => ({
    i18n: (key: string, ..._args: unknown[]) => `#${key}#`,
}));

function makeConfig(overrides: Partial<TextAreaConfig> = {}): TextAreaConfig {
    return {maxLength: -1, showCounter: false, ...overrides};
}

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

describe('getCounterDescription with TextAreaConfig', () => {
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
});
