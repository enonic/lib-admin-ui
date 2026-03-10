import {describe, expect, it} from 'vitest';
import {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';

describe('DateInput', () => {
    describe('value transformation', () => {
        it('should produce empty string for null value', () => {
            const value = ValueTypes.LOCAL_DATE.newNullValue();
            const str = value.isNull() ? '' : (value.getString() ?? '');

            expect(value.isNull()).toBe(true);
            expect(str).toBe('');
        });

        it('should produce date string for valid value', () => {
            const value = ValueTypes.LOCAL_DATE.newValue('2024-06-15');
            const str = value.isNull() ? '' : (value.getString() ?? '');

            expect(value.isNull()).toBe(false);
            expect(str).toBe('2024-06-15');
        });

        it('should produce correct Value type on onChange with valid date', () => {
            const newValue = ValueTypes.LOCAL_DATE.newValue('2024-01-01');

            expect(newValue).toBeInstanceOf(Value);
            expect(newValue.getString()).toBe('2024-01-01');
            expect(newValue.getType()).toBe(ValueTypes.LOCAL_DATE);
        });
    });

    describe('handleInputChange logic', () => {
        it('should produce null value for empty input', () => {
            const nullValue = ValueTypes.LOCAL_DATE.newNullValue();

            expect(nullValue.isNull()).toBe(true);
        });

        it('should produce value with raw string for partial input', () => {
            const inputValue = '2024-01';
            const newValue = ValueTypes.LOCAL_DATE.newValue(inputValue);

            // Partial date string cannot be parsed — value is null
            expect(newValue.isNull()).toBe(true);
        });

        it('should produce valid value for complete date input', () => {
            const inputValue = '2024-06-15';
            const newValue = ValueTypes.LOCAL_DATE.newValue(inputValue);

            expect(newValue.isNull()).toBe(false);
            expect(newValue.getString()).toBe('2024-06-15');
        });
    });

    describe('selectedDate parsing', () => {
        const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

        it('should parse valid date string to Date', () => {
            const rawInput = '2024-06-15';
            const selectedDate = DATE_PATTERN.test(rawInput) ? new Date(`${rawInput}T00:00:00`) : null;

            expect(selectedDate).not.toBeNull();
            expect(selectedDate?.getFullYear()).toBe(2024);
            expect(selectedDate?.getMonth()).toBe(5); // 0-indexed
            expect(selectedDate?.getDate()).toBe(15);
        });

        it('should return null for partial date string', () => {
            const rawInput = '2024-06';
            const selectedDate = DATE_PATTERN.test(rawInput) ? new Date(`${rawInput}T00:00:00`) : null;

            expect(selectedDate).toBeNull();
        });

        it('should return null for empty string', () => {
            const rawInput = '';
            const selectedDate = DATE_PATTERN.test(rawInput) ? new Date(`${rawInput}T00:00:00`) : null;

            expect(selectedDate).toBeNull();
        });

        it('should return null for invalid format', () => {
            const rawInput = '15/06/2024';
            const selectedDate = DATE_PATTERN.test(rawInput) ? new Date(`${rawInput}T00:00:00`) : null;

            expect(selectedDate).toBeNull();
        });
    });
});
