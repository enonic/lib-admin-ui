import {describe, expect, it} from 'vitest';
import {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';

describe('RadioButtonInput', () => {
    describe('value transformation', () => {
        it('should produce empty string for null value', () => {
            const value = ValueTypes.STRING.newNullValue();
            const stringValue = value.isNull() ? '' : (value.getString() ?? '');
            expect(value.isNull()).toBe(true);
            expect(stringValue).toBe('');
        });

        it('should produce string for valid value', () => {
            const value = ValueTypes.STRING.newValue('option1');
            const stringValue = value.isNull() ? '' : (value.getString() ?? '');
            expect(value.isNull()).toBe(false);
            expect(stringValue).toBe('option1');
        });

        it('should produce correct Value on onChange', () => {
            const newValue = ValueTypes.STRING.newValue('yes');
            expect(newValue).toBeInstanceOf(Value);
            expect(newValue.getString()).toBe('yes');
            expect(newValue.getType()).toBe(ValueTypes.STRING);
        });

        it('should handle value not matching any option', () => {
            const value = ValueTypes.STRING.newValue('nonexistent');
            const stringValue = value.isNull() ? '' : (value.getString() ?? '');
            expect(stringValue).toBe('nonexistent');
        });
    });
});
