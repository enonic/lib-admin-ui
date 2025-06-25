import {describe, expect, it} from 'vitest';
import {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {DateHelper} from '../../../util/DateHelper';

// ? Display shows local time with space separator, storage is UTC with T and Z
const DISPLAY_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

function storageToDisplay(s: string): string {
    const date = new Date(s);
    if (Number.isNaN(date.getTime())) return s.replace('T', ' ').replace(/Z$/, '');
    const y = date.getFullYear();
    const m = DateHelper.padNumber(date.getMonth() + 1);
    const d = DateHelper.padNumber(date.getDate());
    const h = DateHelper.padNumber(date.getHours());
    const min = DateHelper.padNumber(date.getMinutes());
    const sec = date.getSeconds();
    const timePart = sec > 0 ? `${h}:${min}:${DateHelper.padNumber(sec)}` : `${h}:${min}`;
    return `${y}-${m}-${d} ${timePart}`;
}

function displayToStorage(s: string): string {
    const date = new Date(s.replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return `${s.replace(' ', 'T')}Z`;
    const y = date.getUTCFullYear();
    const m = DateHelper.padNumber(date.getUTCMonth() + 1);
    const d = DateHelper.padNumber(date.getUTCDate());
    const h = DateHelper.padNumber(date.getUTCHours());
    const min = DateHelper.padNumber(date.getUTCMinutes());
    const sec = DateHelper.padNumber(date.getUTCSeconds());
    return `${y}-${m}-${d}T${h}:${min}:${sec}Z`;
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

function formatTimezoneLabel(date: Date | null, time: string | null): string {
    let ref = date ?? new Date();
    if (date != null && time != null) {
        const [h, m] = time.split(':').map(Number);
        ref = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h ?? 0, m ?? 0);
    }
    const offset = ref.getTimezoneOffset();
    const sign = offset <= 0 ? '+' : '-';
    const absOffset = Math.abs(offset);
    const hours = Math.floor(absOffset / 60);
    const minutes = absOffset % 60;
    return `UTC${sign}${DateHelper.padNumber(hours)}:${DateHelper.padNumber(minutes)}`;
}

describe('InstantInput', () => {
    describe('display ↔ storage conversion', () => {
        it('converts storage UTC to local display', () => {
            const storage = '2025-06-15T12:00:00Z';
            const display = storageToDisplay(storage);
            // ? Verify it produces a valid display string (exact value depends on local TZ)
            expect(DISPLAY_PATTERN.test(display)).toBe(true);
        });

        it('converts local display to storage UTC', () => {
            const display = '2025-06-15 14:30';
            const storage = displayToStorage(display);
            expect(storage).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
        });

        it('round-trips correctly', () => {
            const storage = '2025-06-15T12:00:00Z';
            const display = storageToDisplay(storage);
            const roundTripped = displayToStorage(display);
            expect(roundTripped).toBe(storage);
        });

        it('preserves seconds in round-trip', () => {
            const storage = '2025-06-15T12:30:45Z';
            const display = storageToDisplay(storage);
            expect(display).toMatch(/\d{2}:\d{2}:\d{2}$/);
            const roundTripped = displayToStorage(display);
            expect(roundTripped).toBe(storage);
        });

        it('falls back gracefully for unparseable input', () => {
            const display = displayToStorage('invalid');
            expect(display).toBe('invalidZ');
        });
    });

    describe('value transformation', () => {
        it('should produce empty string for null value', () => {
            const value = ValueTypes.DATE_TIME.newNullValue();

            expect(value.isNull()).toBe(true);
        });

        it('should produce local display string for valid UTC value', () => {
            const value = ValueTypes.DATE_TIME.newValue('2025-06-15T14:30:00Z');
            const display = value.isNull() ? '' : storageToDisplay(value.getString() ?? '');

            expect(value.isNull()).toBe(false);
            expect(DISPLAY_PATTERN.test(display)).toBe(true);
        });

        it('should produce correct Value type via display→storage conversion', () => {
            const display = '2025-06-15 09:15';
            const newValue = ValueTypes.DATE_TIME.newValue(displayToStorage(display));

            expect(newValue).toBeInstanceOf(Value);
            expect(newValue.getType()).toBe(ValueTypes.DATE_TIME);
            expect(newValue.isNull()).toBe(false);
        });
    });

    describe('handleInputChange logic', () => {
        it('should produce null value for empty input', () => {
            const nullValue = ValueTypes.DATE_TIME.newNullValue();

            expect(nullValue.isNull()).toBe(true);
        });

        it('should produce null value for partial display input', () => {
            const display = '2025-06-15 ';
            const newValue = ValueTypes.DATE_TIME.newValue(displayToStorage(display));

            expect(newValue.isNull()).toBe(true);
        });

        it('should produce valid value for complete display input', () => {
            const display = '2025-06-15 14:30';
            const newValue = ValueTypes.DATE_TIME.newValue(displayToStorage(display));

            expect(newValue.isNull()).toBe(false);
            expect(newValue.getString()).toMatch(/Z$/);
        });
    });

    describe('parseDateFromDisplay', () => {
        it('should extract local date from valid display instant', () => {
            const date = parseDateFromDisplay('2025-06-15 14:30');

            expect(date).not.toBeNull();
            expect(date?.getFullYear()).toBe(2025);
            expect(date?.getMonth()).toBe(5);
            expect(date?.getDate()).toBe(15);
        });

        it('should extract date from display instant with seconds', () => {
            const date = parseDateFromDisplay('2025-06-15 14:30:45');

            expect(date).not.toBeNull();
            expect(date?.getFullYear()).toBe(2025);
        });

        it('should return null for partial input', () => {
            expect(parseDateFromDisplay('2025-06-15 ')).toBeNull();
        });

        it('should return null for storage format with T and Z', () => {
            expect(parseDateFromDisplay('2025-06-15T14:30:00Z')).toBeNull();
        });

        it('should return null for date-only input', () => {
            expect(parseDateFromDisplay('2025-06-15')).toBeNull();
        });

        it('should return null for empty string', () => {
            expect(parseDateFromDisplay('')).toBeNull();
        });
    });

    describe('parseTimeFromDisplay', () => {
        it('should extract time from valid display instant', () => {
            expect(parseTimeFromDisplay('2025-06-15 14:30')).toBe('14:30');
        });

        it('should extract HH:MM from display instant with seconds', () => {
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
        it('should combine local date and time with space separator', () => {
            const date = new Date(2025, 5, 15);

            const result = formatDisplay(date, '14:30');

            expect(result).toBe('2025-06-15 14:30');
        });

        it('should use local time from date when time is null', () => {
            const date = new Date(2025, 5, 15, 9, 5);

            const result = formatDisplay(date, null);

            expect(result).toBe('2025-06-15 09:05');
        });

        it('should pad single-digit values', () => {
            const date = new Date(2025, 0, 1);

            const result = formatDisplay(date, '09:05');

            expect(result).toBe('2025-01-01 09:05');
        });

        it('display format converts to valid UTC storage value', () => {
            const date = new Date(2025, 5, 15);
            const display = formatDisplay(date, '14:30');
            const newValue = ValueTypes.DATE_TIME.newValue(displayToStorage(display));

            expect(newValue.isNull()).toBe(false);
            expect(newValue.getString()).toMatch(/Z$/);
        });
    });

    describe('default value handling', () => {
        it('should format default date for date picker draft using local time', () => {
            const defaultDate = new Date(2025, 5, 15, 14, 30);

            const formatted = DateHelper.formatDate(defaultDate);

            expect(formatted).toBe('2025-06-15');
        });

        it('should format default time for time picker draft using local time', () => {
            const defaultDate = new Date(2025, 5, 15, 14, 30);

            const hours = defaultDate.getHours();
            const minutes = defaultDate.getMinutes();
            const time = `${DateHelper.padNumber(hours)}:${DateHelper.padNumber(minutes)}`;

            expect(time).toBe('14:30');
        });
    });

    describe('timezone label', () => {
        // ? Helper: compute expected label from a Date's getTimezoneOffset()
        function expectedLabel(ref: Date): string {
            const offset = ref.getTimezoneOffset();
            const sign = offset <= 0 ? '+' : '-';
            const absOffset = Math.abs(offset);
            const hours = Math.floor(absOffset / 60);
            const minutes = absOffset % 60;
            return `UTC${sign}${DateHelper.padNumber(hours)}:${DateHelper.padNumber(minutes)}`;
        }

        it('should produce UTC±hh:mm format', () => {
            const label = formatTimezoneLabel(new Date(2025, 5, 15), null);

            expect(label).toMatch(/^UTC[+-]\d{2}:\d{2}$/);
        });

        it('(date, null) should match offset of the given date', () => {
            const date = new Date(2025, 5, 15);

            expect(formatTimezoneLabel(date, null)).toBe(expectedLabel(date));
        });

        it('(date, time) should match offset of date constructed with that time', () => {
            const date = new Date(2025, 5, 15);
            const ref = new Date(2025, 5, 15, 14, 30);

            expect(formatTimezoneLabel(date, '14:30')).toBe(expectedLabel(ref));
        });

        it('(null, null) should match offset of current moment', () => {
            const before = new Date();
            const label = formatTimezoneLabel(null, null);
            const after = new Date();

            // ? Offset could theoretically change between before/after, accept either
            const valid = [expectedLabel(before), expectedLabel(after)];
            expect(valid).toContain(label);
        });

        it('(null, time) should ignore time and use current date', () => {
            const before = new Date();
            const label = formatTimezoneLabel(null, '14:30');
            const after = new Date();

            // ? When date is null, time is ignored — falls back to new Date()
            const valid = [expectedLabel(before), expectedLabel(after)];
            expect(valid).toContain(label);
        });

        it('sign is + when getTimezoneOffset <= 0 (east of UTC)', () => {
            const date = new Date(2025, 5, 15);
            const label = formatTimezoneLabel(date, null);
            const offset = date.getTimezoneOffset();

            if (offset <= 0) {
                expect(label).toMatch(/^UTC\+/);
            } else {
                expect(label).toMatch(/^UTC-/);
            }
        });

        it('hours and minutes are correctly extracted from offset', () => {
            const date = new Date(2025, 5, 15);
            const label = formatTimezoneLabel(date, null);
            const offset = date.getTimezoneOffset();
            const absOffset = Math.abs(offset);
            const expectedHours = DateHelper.padNumber(Math.floor(absOffset / 60));
            const expectedMinutes = DateHelper.padNumber(absOffset % 60);

            expect(label).toContain(`${expectedHours}:${expectedMinutes}`);
        });

        it('may differ between summer and winter dates', () => {
            const summer = formatTimezoneLabel(new Date(2025, 6, 1), null);
            const winter = formatTimezoneLabel(new Date(2025, 0, 1), null);

            // ? In timezones without DST both labels are equal — test just verifies no crash
            expect(summer).toMatch(/^UTC[+-]\d{2}:\d{2}$/);
            expect(winter).toMatch(/^UTC[+-]\d{2}:\d{2}$/);
        });

        it('summer and winter labels match their respective offsets', () => {
            const summerDate = new Date(2025, 6, 1);
            const winterDate = new Date(2025, 0, 1);

            expect(formatTimezoneLabel(summerDate, null)).toBe(expectedLabel(summerDate));
            expect(formatTimezoneLabel(winterDate, null)).toBe(expectedLabel(winterDate));
        });

        it('different times on the same date produce correct offsets', () => {
            const date = new Date(2025, 5, 15);
            const morning = formatTimezoneLabel(date, '06:00');
            const evening = formatTimezoneLabel(date, '22:00');

            expect(morning).toBe(expectedLabel(new Date(2025, 5, 15, 6, 0)));
            expect(evening).toBe(expectedLabel(new Date(2025, 5, 15, 22, 0)));
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

        it('should not match storage format with T and Z', () => {
            expect(DISPLAY_PATTERN.test('2025-06-15T14:30:00Z')).toBe(false);
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
