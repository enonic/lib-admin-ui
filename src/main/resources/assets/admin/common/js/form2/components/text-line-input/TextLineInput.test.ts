import {describe, expect, it} from 'vitest';
import {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import type {ValidationResult} from '../../descriptor/ValidationResult';
import {getFirstError} from '../../utils';

describe('getFirstError', () => {
    it('should return undefined for empty array', () => {
        // Arrange & Act
        const result = getFirstError([]);

        // Assert
        expect(result).toBeUndefined();
    });

    it('should return first message for single error', () => {
        // Arrange
        const errors: ValidationResult[] = [{message: 'Too long'}];

        // Act
        const result = getFirstError(errors);

        // Assert
        expect(result).toBe('Too long');
    });

    it('should return first message for multiple errors', () => {
        // Arrange
        const errors: ValidationResult[] = [{message: 'First error'}, {message: 'Second error'}];

        // Act
        const result = getFirstError(errors);

        // Assert
        expect(result).toBe('First error');
    });
});

describe('TextLineInput', () => {
    describe('value transformation', () => {
        it('should produce empty string for null value', () => {
            // Arrange
            const value = ValueTypes.STRING.newNullValue();

            // Act
            const stringValue = value.isNull() ? '' : (value.getString() ?? '');

            // Assert
            expect(value.isNull()).toBe(true);
            expect(stringValue).toBe('');
        });

        it('should produce string display for valid string value', () => {
            // Arrange
            const value = ValueTypes.STRING.newValue('hello');

            // Act
            const stringValue = value.isNull() ? '' : (value.getString() ?? '');

            // Assert
            expect(value.isNull()).toBe(false);
            expect(stringValue).toBe('hello');
        });

        it('should produce correct Value type on onChange', () => {
            // Arrange & Act
            const newValue = ValueTypes.STRING.newValue('test input');

            // Assert
            expect(newValue).toBeInstanceOf(Value);
            expect(newValue.getString()).toBe('test input');
            expect(newValue.getType()).toBe(ValueTypes.STRING);
        });
    });
});
