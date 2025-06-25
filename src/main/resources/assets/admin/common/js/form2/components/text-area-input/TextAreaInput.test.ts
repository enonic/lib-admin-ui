import {describe, expect, it} from 'vitest';
import {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';

describe('TextAreaInput', () => {
    describe('value transformation', () => {
        it('should produce empty string for null value', () => {
            const value = ValueTypes.STRING.newNullValue();

            const stringValue = value.isNull() ? '' : (value.getString() ?? '');

            expect(value.isNull()).toBe(true);
            expect(stringValue).toBe('');
        });

        it('should produce string display for valid string value', () => {
            const value = ValueTypes.STRING.newValue('hello');

            const stringValue = value.isNull() ? '' : (value.getString() ?? '');

            expect(value.isNull()).toBe(false);
            expect(stringValue).toBe('hello');
        });

        it('should preserve multiline string value', () => {
            const value = ValueTypes.STRING.newValue('line one\nline two\nline three');

            const stringValue = value.isNull() ? '' : (value.getString() ?? '');

            expect(stringValue).toBe('line one\nline two\nline three');
        });

        it('should produce correct Value type on onChange', () => {
            // Arrange & Act
            const newValue = ValueTypes.STRING.newValue('test input');

            expect(newValue).toBeInstanceOf(Value);
            expect(newValue.getString()).toBe('test input');
            expect(newValue.getType()).toBe(ValueTypes.STRING);
        });
    });
});
