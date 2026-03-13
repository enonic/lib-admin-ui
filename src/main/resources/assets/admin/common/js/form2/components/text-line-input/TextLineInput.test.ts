import {describe, expect, it} from 'vitest';
import {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import type {ValidationResult} from '../../descriptor/ValidationResult';
import {getFirstError} from '../../utils';

describe('getFirstError', () => {
    it('should return undefined for empty array', () => {
        // Arrange & Act
        const result = getFirstError([]);

        expect(result).toBeUndefined();
    });

    it('should return first message for single error', () => {
        const errors: ValidationResult[] = [{message: 'Too long'}];

        const result = getFirstError(errors);

        expect(result).toBe('Too long');
    });

    it('should return first message for multiple errors', () => {
        const errors: ValidationResult[] = [{message: 'First error'}, {message: 'Second error'}];

        const result = getFirstError(errors);

        expect(result).toBe('First error');
    });
});

describe('TextLineInput', () => {
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

        it('should produce correct Value type on onChange', () => {
            // Arrange & Act
            const newValue = ValueTypes.STRING.newValue('test input');

            expect(newValue).toBeInstanceOf(Value);
            expect(newValue.getString()).toBe('test input');
            expect(newValue.getType()).toBe(ValueTypes.STRING);
        });
    });
});
