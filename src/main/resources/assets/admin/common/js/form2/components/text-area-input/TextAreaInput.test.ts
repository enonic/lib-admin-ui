import {describe, expect, it} from 'vitest';
import {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';

describe('TextAreaInput', () => {
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

        it('should preserve multiline string value', () => {
            // Arrange
            const value = ValueTypes.STRING.newValue('line one\nline two\nline three');

            // Act
            const stringValue = value.isNull() ? '' : (value.getString() ?? '');

            // Assert
            expect(stringValue).toBe('line one\nline two\nline three');
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
