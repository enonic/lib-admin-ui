import {describe, expect, it} from 'vitest';
import {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';

describe('LongInput', () => {
    describe('value transformation', () => {
        it('should produce empty string for null value', () => {
            // Arrange
            const value = ValueTypes.LONG.newNullValue();

            // Act
            const longValue = value.isNull() ? '' : String(value.getLong() ?? '');

            // Assert
            expect(value.isNull()).toBe(true);
            expect(longValue).toBe('');
        });

        it('should produce string display for valid long value', () => {
            // Arrange
            const value = ValueTypes.LONG.newValue('42');

            // Act
            const longValue = value.isNull() ? '' : String(value.getLong() ?? '');

            // Assert
            expect(value.isNull()).toBe(false);
            expect(longValue).toBe('42');
        });

        it('should produce correct Value type on onChange with valid integer', () => {
            // Arrange & Act
            const newValue = ValueTypes.LONG.newValue('100');

            // Assert
            expect(newValue).toBeInstanceOf(Value);
            expect(newValue.getLong()).toBe(100);
            expect(newValue.getType()).toBe(ValueTypes.LONG);
        });

        it('should handle negative integers', () => {
            // Arrange & Act
            const newValue = ValueTypes.LONG.newValue('-50');

            // Assert
            expect(newValue.getLong()).toBe(-50);
            expect(newValue.getType()).toBe(ValueTypes.LONG);
        });

        it('should handle zero', () => {
            // Arrange & Act
            const newValue = ValueTypes.LONG.newValue('0');

            // Assert
            expect(newValue.getLong()).toBe(0);
            expect(newValue.getType()).toBe(ValueTypes.LONG);
        });
    });
});
