import {describe, expect, it, vi} from 'vitest';
import {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {DateHelper} from '../../../util/DateHelper';
import {displayToValue, formatTimezoneLabel, storageToDisplay, valueToDisplay} from './InstantInput';

// ? The real package pulls in DOM-only React internals, unavailable in the node test environment
vi.mock('@enonic/ui', () => ({
    Button: () => null,
    DatePicker: () => null,
    Input: () => null,
    TimePicker: () => null,
}));

const DISPLAY_IN_MINUTES = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

describe('InstantInput', () => {
    describe('storageToDisplay', () => {
        it('converts storage UTC to a minute-precision local display string', () => {
            expect(storageToDisplay('2025-06-15T12:00:00Z')).toMatch(DISPLAY_IN_MINUTES);
        });

        it('drops seconds from the display', () => {
            expect(storageToDisplay('2025-06-15T12:30:45Z')).toMatch(DISPLAY_IN_MINUTES);
        });

        it('drops milliseconds from the display', () => {
            expect(storageToDisplay('2025-06-15T12:30:45.123Z')).toMatch(DISPLAY_IN_MINUTES);
        });

        it('falls back to the bare storage string when it cannot be parsed', () => {
            expect(storageToDisplay('invalid')).toBe('invalid');
        });
    });

    describe('valueToDisplay', () => {
        it('should produce empty string for null value', () => {
            expect(valueToDisplay(ValueTypes.DATE_TIME.newNullValue())).toBe('');
        });

        it('should produce local display string for valid UTC value', () => {
            const value = ValueTypes.DATE_TIME.newValue('2025-06-15T14:30:00Z');

            expect(value.isNull()).toBe(false);
            expect(valueToDisplay(value)).toMatch(DISPLAY_IN_MINUTES);
        });

        it('should not display seconds carried by the value', () => {
            const value = ValueTypes.DATE_TIME.newValue('2025-06-15T14:30:45Z');

            expect(valueToDisplay(value)).toMatch(DISPLAY_IN_MINUTES);
        });

        it('should not display milliseconds carried by the value', () => {
            const value = ValueTypes.DATE_TIME.newValue('2025-06-15T14:30:45.123Z');

            expect(valueToDisplay(value)).toMatch(DISPLAY_IN_MINUTES);
        });
    });

    describe('displayToValue', () => {
        it('converts local display input to a UTC instant value', () => {
            const value = displayToValue('2025-06-15 09:15');

            expect(value).toBeInstanceOf(Value);
            expect(value.getType()).toBe(ValueTypes.DATE_TIME);
            expect(value.getString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00Z$/);
        });

        // ? Round-trip, because the exact stored UTC value depends on the local TZ
        it('preserves the local wall-clock time through the local-to-UTC conversion', () => {
            expect(valueToDisplay(displayToValue('2025-06-15 14:30'))).toBe('2025-06-15 14:30');
        });

        it.each(['2025-06-15 00:00', '2025-06-15 23:59', '2024-02-29 12:00'])(
            'accepts the edge but valid input "%s"',
            input => {
                expect(displayToValue(input).isNull()).toBe(false);
            },
        );

        it('always stores zero seconds', () => {
            expect(displayToValue('2025-06-15 14:30').getString()).toMatch(/:00Z$/);
        });

        it.each(['', '2025-06-15 ', '2025-06-15', '2025-06-15T14:30', '2025-06-15T14:30:00Z', '14:30', 'garbage'])(
            'rejects malformed input "%s"',
            input => {
                const value = displayToValue(input);

                expect(value.isNull()).toBe(true);
                expect(value.getType()).toBe(ValueTypes.DATE_TIME);
            },
        );

        it.each(['2025-06-15 14:30:45', '2025-06-15 14:30:45.123'])('rejects input carrying seconds "%s"', input => {
            expect(displayToValue(input).isNull()).toBe(true);
        });

        it.each(['2025-06-15 25:00', '2025-06-15 14:60'])('rejects out-of-range time "%s"', input => {
            expect(displayToValue(input).isNull()).toBe(true);
        });

        it.each(['2025-06-31 12:00', '2025-02-30 09:15', '2025-13-01 12:00', '2025-06-32 12:00'])(
            'rejects the impossible date "%s" without throwing',
            input => {
                expect(() => displayToValue(input)).not.toThrow();
                expect(displayToValue(input).isNull()).toBe(true);
            },
        );
    });

    describe('formatTimezoneLabel', () => {
        function expectedLabel(ref: Date): string {
            const offset = ref.getTimezoneOffset();
            const sign = offset <= 0 ? '+' : '-';
            const absOffset = Math.abs(offset);
            const hours = Math.floor(absOffset / 60);
            const minutes = absOffset % 60;
            return `UTC${sign}${DateHelper.padNumber(hours)}:${DateHelper.padNumber(minutes)}`;
        }

        it('should produce UTC±hh:mm format', () => {
            expect(formatTimezoneLabel(new Date(2025, 5, 15), null)).toMatch(/^UTC[+-]\d{2}:\d{2}$/);
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
            expect([expectedLabel(before), expectedLabel(after)]).toContain(label);
        });

        it('(null, time) should ignore time and use current date', () => {
            const before = new Date();
            const label = formatTimezoneLabel(null, '14:30');
            const after = new Date();

            expect([expectedLabel(before), expectedLabel(after)]).toContain(label);
        });

        it('summer and winter labels match their respective offsets', () => {
            const summerDate = new Date(2025, 6, 1);
            const winterDate = new Date(2025, 0, 1);

            expect(formatTimezoneLabel(summerDate, null)).toBe(expectedLabel(summerDate));
            expect(formatTimezoneLabel(winterDate, null)).toBe(expectedLabel(winterDate));
        });

        it('different times on the same date produce correct offsets', () => {
            const date = new Date(2025, 5, 15);

            expect(formatTimezoneLabel(date, '06:00')).toBe(expectedLabel(new Date(2025, 5, 15, 6, 0)));
            expect(formatTimezoneLabel(date, '22:00')).toBe(expectedLabel(new Date(2025, 5, 15, 22, 0)));
        });
    });
});
