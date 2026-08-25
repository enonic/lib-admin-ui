import {describe, expect, it, vi} from 'vitest';
import {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {displayToValue, valueToDisplay} from './DateTimeInput';

// ? The real package pulls in DOM-only React internals, unavailable in the node test environment
vi.mock('@enonic/ui', () => ({
    Button: () => null,
    DatePicker: () => null,
    Input: () => null,
    TimePicker: () => null,
}));

describe('DateTimeInput', () => {
    describe('valueToDisplay', () => {
        it('should produce empty string for null value', () => {
            expect(valueToDisplay(ValueTypes.LOCAL_DATE_TIME.newNullValue())).toBe('');
        });

        it('should produce display string for valid value', () => {
            const value = ValueTypes.LOCAL_DATE_TIME.newValue('2025-06-15T14:30');

            expect(value.isNull()).toBe(false);
            expect(valueToDisplay(value)).toBe('2025-06-15 14:30');
        });

        it('should drop the zero seconds LocalDateTime always serialises', () => {
            const value = ValueTypes.LOCAL_DATE_TIME.newValue('2025-06-15T14:30:00');

            expect(valueToDisplay(value)).toBe('2025-06-15 14:30');
        });

        it('should truncate a value carrying seconds to minutes', () => {
            const value = ValueTypes.LOCAL_DATE_TIME.newValue('2025-06-15T14:30:45');

            expect(valueToDisplay(value)).toBe('2025-06-15 14:30');
        });

        it('should truncate a value carrying fractions to minutes', () => {
            const value = ValueTypes.LOCAL_DATE_TIME.newValue('2025-06-15T14:30:45.123');

            expect(valueToDisplay(value)).toBe('2025-06-15 14:30');
        });
    });

    describe('displayToValue', () => {
        it('converts display input to a LocalDateTime value', () => {
            const value = displayToValue('2025-06-15 09:15');

            expect(value).toBeInstanceOf(Value);
            expect(value.getType()).toBe(ValueTypes.LOCAL_DATE_TIME);
            expect(value.getString()).toBe('2025-06-15T09:15:00');
        });

        it.each(['2025-06-15 00:00', '2025-06-15 23:59', '2024-02-29 12:00'])(
            'accepts the edge but valid input "%s"',
            input => {
                expect(displayToValue(input).isNull()).toBe(false);
            },
        );

        it('always stores zero seconds', () => {
            expect(displayToValue('2025-06-15 14:30').getString()).toBe('2025-06-15T14:30:00');
        });

        it.each(['', '2025-06-15 ', '2025-06-15', '2025-06-15T14:30', '14:30', 'garbage'])(
            'rejects malformed input "%s"',
            input => {
                const value = displayToValue(input);

                expect(value.isNull()).toBe(true);
                expect(value.getType()).toBe(ValueTypes.LOCAL_DATE_TIME);
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
});
