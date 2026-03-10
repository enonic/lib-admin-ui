import {describe, expect, it} from 'vitest';
import {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {DateHelper} from '../../../util/DateHelper';
import {DATETIME_PATTERN} from '../../descriptor/DateTimeDescriptor';

function parseDateFromDateTime(raw: string): Date | null {
    if (!DATETIME_PATTERN.test(raw)) return null;
    const datePart = raw.slice(0, 10);
    const parsed = new Date(`${datePart}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
}

function parseTimeFromDateTime(raw: string): string | null {
    if (!DATETIME_PATTERN.test(raw)) return null;
    const timePart = raw.slice(11);
    const parts = timePart.split(':');
    const hour = Number.parseInt(parts[0] ?? '', 10);
    const minute = Number.parseInt(parts[1] ?? '', 10);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return `${DateHelper.padNumber(hour)}:${DateHelper.padNumber(minute)}`;
}

function formatDateTime(date: Date, time: string | null): string {
    const datePart = DateHelper.formatDate(date);
    const timePart = time ?? `${DateHelper.padNumber(date.getHours())}:${DateHelper.padNumber(date.getMinutes())}`;
    return `${datePart}T${timePart}`;
}

describe('DateTimeInput', () => {
    describe('value transformation', () => {
        it('should produce empty string for null value', () => {
            const value = ValueTypes.LOCAL_DATE_TIME.newNullValue();

            const str = value.isNull() ? '' : (value.getString() ?? '');

            expect(value.isNull()).toBe(true);
            expect(str).toBe('');
        });

        it('should produce datetime string for valid value', () => {
            const value = ValueTypes.LOCAL_DATE_TIME.newValue('2025-06-15T14:30');

            const str = value.isNull() ? '' : (value.getString() ?? '');

            expect(value.isNull()).toBe(false);
            // LocalDateTime.toString() always includes seconds
            expect(str).toBe('2025-06-15T14:30:00');
        });

        it('should produce correct Value type on onChange with valid datetime', () => {
            // Arrange & Act
            const newValue = ValueTypes.LOCAL_DATE_TIME.newValue('2025-06-15T09:15');

            expect(newValue).toBeInstanceOf(Value);
            expect(newValue.getString()).toBe('2025-06-15T09:15:00');
            expect(newValue.getType()).toBe(ValueTypes.LOCAL_DATE_TIME);
        });

        it('should handle datetime with seconds', () => {
            // Arrange & Act
            const value = ValueTypes.LOCAL_DATE_TIME.newValue('2025-06-15T14:30:45');

            expect(value.isNull()).toBe(false);
            expect(value.getString()).toBe('2025-06-15T14:30:45');
        });
    });

    describe('handleInputChange logic', () => {
        it('should produce null value for empty input', () => {
            // Arrange & Act
            const nullValue = ValueTypes.LOCAL_DATE_TIME.newNullValue();

            expect(nullValue.isNull()).toBe(true);
        });

        it('should produce null value for partial input', () => {
            const inputValue = '2025-06-15T';

            const newValue = ValueTypes.LOCAL_DATE_TIME.newValue(inputValue);

            expect(newValue.isNull()).toBe(true);
        });

        it('should produce valid value for complete datetime input', () => {
            const inputValue = '2025-06-15T14:30';

            const newValue = ValueTypes.LOCAL_DATE_TIME.newValue(inputValue);

            expect(newValue.isNull()).toBe(false);
            expect(newValue.getString()).toBe('2025-06-15T14:30:00');
        });
    });

    describe('parseDateFromDateTime', () => {
        it('should extract date from valid datetime', () => {
            const date = parseDateFromDateTime('2025-06-15T14:30');

            expect(date).not.toBeNull();
            expect(date?.getFullYear()).toBe(2025);
            expect(date?.getMonth()).toBe(5);
            expect(date?.getDate()).toBe(15);
        });

        it('should extract date from datetime with seconds', () => {
            const date = parseDateFromDateTime('2025-06-15T14:30:45');

            expect(date).not.toBeNull();
            expect(date?.getFullYear()).toBe(2025);
        });

        it('should return null for partial input', () => {
            // Act & Assert
            expect(parseDateFromDateTime('2025-06-15T')).toBeNull();
        });

        it('should return null for date-only input', () => {
            // Act & Assert
            expect(parseDateFromDateTime('2025-06-15')).toBeNull();
        });

        it('should return null for empty string', () => {
            // Act & Assert
            expect(parseDateFromDateTime('')).toBeNull();
        });
    });

    describe('parseTimeFromDateTime', () => {
        it('should extract time from valid datetime', () => {
            // Act & Assert
            expect(parseTimeFromDateTime('2025-06-15T14:30')).toBe('14:30');
        });

        it('should extract HH:MM from datetime with seconds', () => {
            // Act & Assert
            expect(parseTimeFromDateTime('2025-06-15T14:30:45')).toBe('14:30');
        });

        it('should return null for partial input', () => {
            // Act & Assert
            expect(parseTimeFromDateTime('2025-06-15T')).toBeNull();
        });

        it('should return null for empty string', () => {
            // Act & Assert
            expect(parseTimeFromDateTime('')).toBeNull();
        });

        it('should return null for invalid hour', () => {
            // Act & Assert
            expect(parseTimeFromDateTime('2025-06-15T25:00')).toBeNull();
        });

        it('should return null for invalid minute', () => {
            // Act & Assert
            expect(parseTimeFromDateTime('2025-06-15T14:60')).toBeNull();
        });
    });

    describe('formatDateTime', () => {
        it('should combine date and time', () => {
            const date = new Date(2025, 5, 15);

            const result = formatDateTime(date, '14:30');

            expect(result).toBe('2025-06-15T14:30');
        });

        it('should use time from date when time is null', () => {
            const date = new Date(2025, 5, 15, 9, 5);

            const result = formatDateTime(date, null);

            expect(result).toBe('2025-06-15T09:05');
        });

        it('should pad single-digit values', () => {
            const date = new Date(2025, 0, 1);

            const result = formatDateTime(date, '09:05');

            expect(result).toBe('2025-01-01T09:05');
        });
    });

    describe('default value handling', () => {
        it('should format default date for date picker draft', () => {
            const defaultDate = new Date(2025, 5, 15, 14, 30);

            const formatted = DateHelper.formatDate(defaultDate);

            expect(formatted).toBe('2025-06-15');
        });

        it('should format default time for time picker draft', () => {
            const defaultDate = new Date(2025, 5, 15, 14, 30);

            const hours = defaultDate.getHours();
            const minutes = defaultDate.getMinutes();
            const time = `${DateHelper.padNumber(hours)}:${DateHelper.padNumber(minutes)}`;

            expect(time).toBe('14:30');
        });

        it('should produce valid value from formatted datetime', () => {
            const date = new Date(2025, 5, 15);
            const formatted = formatDateTime(date, '14:30');

            const newValue = ValueTypes.LOCAL_DATE_TIME.newValue(formatted);

            expect(newValue.isNull()).toBe(false);
            expect(newValue.getString()).toBe('2025-06-15T14:30:00');
        });
    });

    describe('DATETIME_PATTERN', () => {
        it('should match YYYY-MM-DDThh:mm', () => {
            expect(DATETIME_PATTERN.test('2025-06-15T14:30')).toBe(true);
        });

        it('should match YYYY-MM-DDThh:mm:ss', () => {
            expect(DATETIME_PATTERN.test('2025-06-15T14:30:45')).toBe(true);
        });

        it('should match YYYY-MM-DDThh:mm:ss.mmm', () => {
            expect(DATETIME_PATTERN.test('2025-06-15T14:30:45.123')).toBe(true);
        });

        it('should not match date only', () => {
            expect(DATETIME_PATTERN.test('2025-06-15')).toBe(false);
        });

        it('should not match time only', () => {
            expect(DATETIME_PATTERN.test('14:30')).toBe(false);
        });

        it('should not match datetime with timezone', () => {
            expect(DATETIME_PATTERN.test('2025-06-15T14:30+01:00')).toBe(false);
        });

        it('should not match empty string', () => {
            expect(DATETIME_PATTERN.test('')).toBe(false);
        });
    });
});
