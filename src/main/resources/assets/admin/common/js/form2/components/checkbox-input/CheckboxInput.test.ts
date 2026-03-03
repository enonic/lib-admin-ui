import {describe, expect, it} from 'vitest';
import type {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {InputBuilder} from '../../../form/Input';
import {InputTypeName} from '../../../form/InputTypeName';
import {OccurrencesBuilder} from '../../../form/Occurrences';
import type {CheckboxConfig} from '../../descriptor/InputTypeConfig';

//
// * Helpers
//

function _makeConfig(overrides: Partial<CheckboxConfig> = {}): CheckboxConfig {
    return {alignment: 'LEFT', ...overrides};
}

function makeInput(minOccurrences = 0) {
    return new InputBuilder()
        .setName('myCheckbox')
        .setInputType(new InputTypeName('Checkbox', false))
        .setLabel('Accept Terms')
        .setOccurrences(new OccurrencesBuilder().setMinimum(minOccurrences).setMaximum(1).build())
        .setHelpText('')
        .setInputTypeConfig({})
        .build();
}

/** Simulate handleCheckedChange logic from the component. */
function simulateCheckedChange(checked: boolean | 'indeterminate', isRequired: boolean): Value {
    if (checked === true) {
        return ValueTypes.BOOLEAN.fromJsonValue(true);
    }
    return isRequired ? ValueTypes.BOOLEAN.newNullValue() : ValueTypes.BOOLEAN.fromJsonValue(false);
}

/** Simulate isChecked derivation from the component. */
function deriveIsChecked(value: Value): boolean {
    return value.isNull() ? false : (value.getBoolean() ?? false);
}

describe('CheckboxInput', () => {
    describe('value transformation', () => {
        it('should produce false for null value', () => {
            const value = ValueTypes.BOOLEAN.newNullValue();

            expect(value.isNull()).toBe(true);
            expect(deriveIsChecked(value)).toBe(false);
        });

        it('should produce true for boolean true value', () => {
            const value = ValueTypes.BOOLEAN.fromJsonValue(true);

            expect(value.isNull()).toBe(false);
            expect(deriveIsChecked(value)).toBe(true);
        });

        it('should produce false for boolean false value', () => {
            const value = ValueTypes.BOOLEAN.fromJsonValue(false);

            expect(value.isNull()).toBe(false);
            expect(deriveIsChecked(value)).toBe(false);
        });
    });

    describe('handleCheckedChange logic', () => {
        it('should create true Value when checked', () => {
            const result = simulateCheckedChange(true, false);

            expect(result.isNull()).toBe(false);
            expect(result.getBoolean()).toBe(true);
            expect(result.getType()).toBe(ValueTypes.BOOLEAN);
        });

        it('should create false Value when unchecked (optional)', () => {
            const result = simulateCheckedChange(false, false);

            expect(result.isNull()).toBe(false);
            expect(result.getBoolean()).toBe(false);
            expect(result.getType()).toBe(ValueTypes.BOOLEAN);
        });

        it('should create null Value when unchecked (required)', () => {
            const result = simulateCheckedChange(false, true);

            expect(result.isNull()).toBe(true);
            expect(result.getType()).toBe(ValueTypes.BOOLEAN);
        });

        it('should treat indeterminate as unchecked (optional)', () => {
            const result = simulateCheckedChange('indeterminate', false);

            expect(result.isNull()).toBe(false);
            expect(result.getBoolean()).toBe(false);
        });

        it('should treat indeterminate as unchecked (required)', () => {
            const result = simulateCheckedChange('indeterminate', true);

            expect(result.isNull()).toBe(true);
        });
    });

    describe('isRequired derivation', () => {
        it('should be required when minimum occurrences > 0', () => {
            const input = makeInput(1);
            expect(input.getOccurrences().getMinimum()).toBeGreaterThan(0);
        });

        it('should not be required when minimum occurrences is 0', () => {
            const input = makeInput(0);
            expect(input.getOccurrences().getMinimum()).toBe(0);
        });
    });

    describe('round-trip: check → uncheck → check', () => {
        it('optional checkbox: false → true → false', () => {
            const v0 = ValueTypes.BOOLEAN.fromJsonValue(false);
            expect(deriveIsChecked(v0)).toBe(false);

            const v1 = simulateCheckedChange(true, false);
            expect(deriveIsChecked(v1)).toBe(true);

            const v2 = simulateCheckedChange(false, false);
            expect(deriveIsChecked(v2)).toBe(false);
            expect(v2.isNull()).toBe(false);
        });

        it('required checkbox: null → true → null', () => {
            const v0 = ValueTypes.BOOLEAN.newNullValue();
            expect(deriveIsChecked(v0)).toBe(false);

            const v1 = simulateCheckedChange(true, true);
            expect(deriveIsChecked(v1)).toBe(true);

            const v2 = simulateCheckedChange(false, true);
            expect(deriveIsChecked(v2)).toBe(false);
            expect(v2.isNull()).toBe(true);
        });
    });
});
