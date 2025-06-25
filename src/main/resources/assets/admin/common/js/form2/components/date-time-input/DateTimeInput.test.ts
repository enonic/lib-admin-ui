import {describe, expect, it} from 'vitest';
import {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {DateHelper} from '../../../util/DateHelper';

// ? Display uses space separator (2025-06-15 14:30), storage uses T (2025-06-15T14:30)
const DISPLAY_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

function storageToDisplay(s: string): string {
    return s.replace('T', ' ');
}

function displayToStorage(s: string): string {
    return s.replace(' ', 'T');
}

function parseDateFromDisplay(raw: string): Date | null {
    if (!DISPLAY_PATTERN.test(raw)) return null;
    const datePart = raw.slice(0, 10);
    const parsed = new Date(`${datePart}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
}

function parseTimeFromDisplay(raw: string): string | null {
    if (!DISPLAY_PATTERN.test(raw)) return null;
    const timePart = raw.slice(11);
    const parts = timePart.split(':');
    const hour = Number.parseInt(parts[0] ?? '', 10);
    const minute = Number.parseInt(parts[1] ?? '', 10);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return `${DateHelper.padNumber(hour)}:${DateHelper.padNumber(minute)}`;
}

function formatDisplay(date: Date, time: string | null): string {
    const datePart = DateHelper.formatDate(date);
    const timePart = time ?? `${DateHelper.padNumber(date.getHours())}:${DateHelper.padNumber(date.getMinutes())}`;
    return `${datePart} ${timePart}`;
}

describe('DateTimeInput', () => {
    describe('display ↔ storage conversion', () => {
        it('converts storage format to display format', () => {
            expect(storageToDisplay('2025-06-15T14:30:00')).toBe('2025-06-15 14:30:00');
        });

        it('converts display format to storage format', () => {
            expect(displayToStorage('2025-06-15 14:30')).toBe('2025-06-15T14:30');
        });

        it('round-trips correctly', () => {
            const storage = '2025-06-15T14:30:00';
            expect(displayToStorage(storageToDisplay(storage))).toBe(storage);
        });
    });

    describe('value transformation', () => {
        it('should produce empty string for null value', () => {
            const value = ValueTypes.LOCAL_DATE_TIME.newNullValue();

            expect(value.isNull()).toBe(true);
        });

        it('should produce display string for valid value', () => {
            const value = ValueTypes.LOCAL_DATE_TIME.newValue('2025-06-15T14:30');
            const str = value.isNull() ? '' : storageToDisplay(value.getString() ?? '');

            expect(value.isNull()).toBe(false);
            // LocalDateTime.toString() always includes seconds
            expect(str).toBe('2025-06-15 14:30:00');
        });

        it('should produce correct Value type on onChange with valid datetime', () => {
            const displayInput = '2025-06-15 09:15';
            const newValue = ValueTypes.LOCAL_DATE_TIME.newValue(displayToStorage(displayInput));

            expect(newValue).toBeInstanceOf(Value);
            expect(newValue.getString()).toBe('2025-06-15T09:15:00');
            expect(newValue.getType()).toBe(ValueTypes.LOCAL_DATE_TIME);
        });

        it('should handle datetime with seconds', () => {
            const value = ValueTypes.LOCAL_DATE_TIME.newValue('2025-06-15T14:30:45');

            expect(value.isNull()).toBe(false);
            expect(value.getString()).toBe('2025-06-15T14:30:45');
        });
    });

    describe('handleInputChange logic', () => {
        it('should produce null value for empty input', () => {
            const nullValue = ValueTypes.LOCAL_DATE_TIME.newNullValue();

            expect(nullValue.isNull()).toBe(true);
        });

        it('should produce null value for partial display input', () => {
            const displayInput = '2025-06-15 ';
            const newValue = ValueTypes.LOCAL_DATE_TIME.newValue(displayToStorage(displayInput));

            expect(newValue.isNull()).toBe(true);
        });

        it('should produce valid value for complete display input', () => {
            const displayInput = '2025-06-15 14:30';
            const newValue = ValueTypes.LOCAL_DATE_TIME.newValue(displayToStorage(displayInput));

            expect(newValue.isNull()).toBe(false);
            expect(newValue.getString()).toBe('2025-06-15T14:30:00');
        });
    });

    describe('parseDateFromDisplay', () => {
        it('should extract date from valid display datetime', () => {
            const date = parseDateFromDisplay('2025-06-15 14:30');

            expect(date).not.toBeNull();
            expect(date?.getFullYear()).toBe(2025);
            expect(date?.getMonth()).toBe(5);
            expect(date?.getDate()).toBe(15);
        });

        it('should extract date from display datetime with seconds', () => {
            const date = parseDateFromDisplay('2025-06-15 14:30:45');

            expect(date).not.toBeNull();
            expect(date?.getFullYear()).toBe(2025);
        });

        it('should return null for partial input', () => {
            expect(parseDateFromDisplay('2025-06-15 ')).toBeNull();
        });

        it('should return null for date-only input', () => {
            expect(parseDateFromDisplay('2025-06-15')).toBeNull();
        });

        it('should return null for storage format with T', () => {
            expect(parseDateFromDisplay('2025-06-15T14:30')).toBeNull();
        });

        it('should return null for empty string', () => {
            expect(parseDateFromDisplay('')).toBeNull();
        });
    });

    describe('parseTimeFromDisplay', () => {
        it('should extract time from valid display datetime', () => {
            expect(parseTimeFromDisplay('2025-06-15 14:30')).toBe('14:30');
        });

        it('should extract HH:MM from display datetime with seconds', () => {
            expect(parseTimeFromDisplay('2025-06-15 14:30:45')).toBe('14:30');
        });

        it('should return null for partial input', () => {
            expect(parseTimeFromDisplay('2025-06-15 ')).toBeNull();
        });

        it('should return null for empty string', () => {
            expect(parseTimeFromDisplay('')).toBeNull();
        });

        it('should return null for invalid hour', () => {
            expect(parseTimeFromDisplay('2025-06-15 25:00')).toBeNull();
        });

        it('should return null for invalid minute', () => {
            expect(parseTimeFromDisplay('2025-06-15 14:60')).toBeNull();
        });
    });

    describe('formatDisplay', () => {
        it('should combine date and time with space separator', () => {
            const date = new Date(2025, 5, 15);

            const result = formatDisplay(date, '14:30');

            expect(result).toBe('2025-06-15 14:30');
        });

        it('should use time from date when time is null', () => {
            const date = new Date(2025, 5, 15, 9, 5);

            const result = formatDisplay(date, null);

            expect(result).toBe('2025-06-15 09:05');
        });

        it('should pad single-digit values', () => {
            const date = new Date(2025, 0, 1);

            const result = formatDisplay(date, '09:05');

            expect(result).toBe('2025-01-01 09:05');
        });

        it('display format converts to valid storage value', () => {
            const date = new Date(2025, 5, 15);
            const display = formatDisplay(date, '14:30');
            const newValue = ValueTypes.LOCAL_DATE_TIME.newValue(displayToStorage(display));

            expect(newValue.isNull()).toBe(false);
            expect(newValue.getString()).toBe('2025-06-15T14:30:00');
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
    });

    describe('DISPLAY_PATTERN', () => {
        it('should match YYYY-MM-DD hh:mm', () => {
            expect(DISPLAY_PATTERN.test('2025-06-15 14:30')).toBe(true);
        });

        it('should match YYYY-MM-DD hh:mm:ss', () => {
            expect(DISPLAY_PATTERN.test('2025-06-15 14:30:45')).toBe(true);
        });

        it('should match YYYY-MM-DD hh:mm:ss.mmm', () => {
            expect(DISPLAY_PATTERN.test('2025-06-15 14:30:45.123')).toBe(true);
        });

        it('should not match storage format with T', () => {
            expect(DISPLAY_PATTERN.test('2025-06-15T14:30')).toBe(false);
        });

        it('should not match date only', () => {
            expect(DISPLAY_PATTERN.test('2025-06-15')).toBe(false);
        });

        it('should not match time only', () => {
            expect(DISPLAY_PATTERN.test('14:30')).toBe(false);
        });

        it('should not match empty string', () => {
            expect(DISPLAY_PATTERN.test('')).toBe(false);
        });
    });
});
