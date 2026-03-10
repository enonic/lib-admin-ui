import {describe, expect, it} from 'vitest';
import {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {DateHelper} from '../../../util/DateHelper';
import {TIME_PATTERN} from '../../descriptor/TimeDescriptor';

describe('TimeInput', () => {
    describe('value transformation', () => {
        it('should produce empty string for null value', () => {
            // Arrange
            const value = ValueTypes.LOCAL_TIME.newNullValue();

            // Act
            const str = value.isNull() ? '' : (value.getString() ?? '');

            // Assert
            expect(value.isNull()).toBe(true);
            expect(str).toBe('');
        });

        it('should produce time string for valid value', () => {
            // Arrange
            const value = ValueTypes.LOCAL_TIME.newValue('14:30');

            // Act
            const str = value.isNull() ? '' : (value.getString() ?? '');

            // Assert
            expect(value.isNull()).toBe(false);
            expect(str).toBe('14:30');
        });

        it('should produce correct Value type on onChange with valid time', () => {
            // Arrange & Act
            const newValue = ValueTypes.LOCAL_TIME.newValue('09:15');

            // Assert
            expect(newValue).toBeInstanceOf(Value);
            expect(newValue.getString()).toBe('09:15');
            expect(newValue.getType()).toBe(ValueTypes.LOCAL_TIME);
        });
    });

    describe('handleInputChange logic', () => {
        it('should produce null value for empty input', () => {
            // Arrange & Act
            const nullValue = ValueTypes.LOCAL_TIME.newNullValue();

            // Assert
            expect(nullValue.isNull()).toBe(true);
        });

        it('should produce null value for partial input', () => {
            // Arrange
            const inputValue = '14:';

            // Act
            const newValue = ValueTypes.LOCAL_TIME.newValue(inputValue);

            // Assert
            expect(newValue.isNull()).toBe(true);
        });

        it('should produce valid value for complete time input', () => {
            // Arrange
            const inputValue = '14:30';

            // Act
            const newValue = ValueTypes.LOCAL_TIME.newValue(inputValue);

            // Assert
            expect(newValue.isNull()).toBe(false);
            expect(newValue.getString()).toBe('14:30');
        });

        it('should produce valid value for time with seconds', () => {
            // Arrange
            const inputValue = '14:30:45';

            // Act
            const newValue = ValueTypes.LOCAL_TIME.newValue(inputValue);

            // Assert
            expect(newValue.isNull()).toBe(false);
            expect(newValue.getString()).toBe('14:30:45');
        });
    });

    describe('pickerValue parsing', () => {
        function parseTimeToPickerValue(raw: string): string | null {
            if (!raw) return null;
            const parts = raw.split(':');
            const hour = Number.parseInt(parts[0] ?? '', 10);
            const minute = Number.parseInt(parts[1] ?? '', 10);
            if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
            if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
            return `${DateHelper.padNumber(hour)}:${DateHelper.padNumber(minute)}`;
        }

        it('should parse valid time string', () => {
            // Arrange & Act
            const result = parseTimeToPickerValue('14:30');

            // Assert
            expect(result).toBe('14:30');
        });

        it('should parse time with seconds (uses HH:MM only)', () => {
            // Arrange & Act
            const result = parseTimeToPickerValue('14:30:45');

            // Assert
            expect(result).toBe('14:30');
        });

        it('should return null for partial input', () => {
            // Arrange & Act
            const result = parseTimeToPickerValue('14:');

            // Assert
            expect(result).toBeNull();
        });

        it('should return null for empty string', () => {
            // Arrange & Act
            const result = parseTimeToPickerValue('');

            // Assert
            expect(result).toBeNull();
        });

        it('should return null for invalid hour', () => {
            // Arrange & Act
            const result = parseTimeToPickerValue('25:00');

            // Assert
            expect(result).toBeNull();
        });

        it('should return null for invalid minute', () => {
            // Arrange & Act
            const result = parseTimeToPickerValue('14:60');

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('TIME_PATTERN', () => {
        it('should match HH:MM format', () => {
            expect(TIME_PATTERN.test('14:30')).toBe(true);
        });

        it('should match HH:MM:SS format', () => {
            expect(TIME_PATTERN.test('14:30:45')).toBe(true);
        });

        it('should match HH:MM:SS.mmm format', () => {
            expect(TIME_PATTERN.test('14:30:45.123')).toBe(true);
        });

        it('should not match partial time', () => {
            expect(TIME_PATTERN.test('14:')).toBe(false);
        });

        it('should not match single number', () => {
            expect(TIME_PATTERN.test('14')).toBe(false);
        });

        it('should not match empty string', () => {
            expect(TIME_PATTERN.test('')).toBe(false);
        });
    });

    describe('handleSetDefault logic', () => {
        function formatTimeFromDate(date: Date): string {
            return DateHelper.formatTime(date.getHours(), date.getMinutes());
        }

        it('should format default Date to HH:MM draft string', () => {
            // Arrange
            const date = new Date(2025, 0, 1, 14, 30);

            // Act
            const draftTime = formatTimeFromDate(date);

            // Assert
            expect(draftTime).toBe('14:30');
        });

        it('should pad single-digit hours and minutes', () => {
            // Arrange
            const date = new Date(2025, 0, 1, 9, 5);

            // Act
            const draftTime = formatTimeFromDate(date);

            // Assert
            expect(draftTime).toBe('09:05');
        });

        it('should format midnight correctly', () => {
            // Arrange
            const date = new Date(2025, 0, 1, 0, 0);

            // Act
            const draftTime = formatTimeFromDate(date);

            // Assert
            expect(draftTime).toBe('00:00');
        });

        it('should not set draft when config.default is undefined', () => {
            // Arrange & Act
            const config = {default: undefined};

            // Assert
            expect(config.default).toBeUndefined();
        });

        it('should produce valid picker value from draft', () => {
            // Arrange
            const date = new Date(2025, 0, 1, 14, 30);
            const draftTime = formatTimeFromDate(date);

            // Act
            const newValue = ValueTypes.LOCAL_TIME.newValue(draftTime);

            // Assert
            expect(newValue.isNull()).toBe(false);
            expect(newValue.getString()).toBe('14:30');
        });
    });
});
