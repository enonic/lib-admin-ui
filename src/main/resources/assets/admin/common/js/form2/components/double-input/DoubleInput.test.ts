import {describe, expect, it} from 'vitest';
import {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {getStep} from './utils';

describe('DoubleInput', () => {
    describe('value transformation', () => {
        it('should produce empty string for null value', () => {
            // Arrange
            const value = ValueTypes.DOUBLE.newNullValue();

            // Act
            const doubleValue = value.isNull() ? '' : String(value.getDouble() ?? '');

            // Assert
            expect(value.isNull()).toBe(true);
            expect(doubleValue).toBe('');
        });

        it('should produce string display for valid double value', () => {
            // Arrange
            const value = ValueTypes.DOUBLE.newValue('3.14');

            // Act
            const doubleValue = value.isNull() ? '' : String(value.getDouble() ?? '');

            // Assert
            expect(value.isNull()).toBe(false);
            expect(doubleValue).toBe('3.14');
        });

        it('should produce correct Value type on onChange with valid double', () => {
            // Arrange & Act
            const newValue = ValueTypes.DOUBLE.newValue('3.14');

            // Assert
            expect(newValue).toBeInstanceOf(Value);
            expect(newValue.getDouble()).toBe(3.14);
            expect(newValue.getType()).toBe(ValueTypes.DOUBLE);
        });

        it('should handle negative doubles', () => {
            // Arrange & Act
            const newValue = ValueTypes.DOUBLE.newValue('-1.5');

            // Assert
            expect(newValue.getDouble()).toBe(-1.5);
            expect(newValue.getType()).toBe(ValueTypes.DOUBLE);
        });

        it('should handle zero', () => {
            // Arrange & Act
            const newValue = ValueTypes.DOUBLE.newValue('0');

            // Assert
            expect(newValue.getDouble()).toBe(0);
            expect(newValue.getType()).toBe(ValueTypes.DOUBLE);
        });

        it('should handle integer-like doubles', () => {
            // Arrange & Act
            const newValue = ValueTypes.DOUBLE.newValue('42');

            // Assert
            expect(newValue.getDouble()).toBe(42);
            expect(newValue.getType()).toBe(ValueTypes.DOUBLE);
        });
    });

    describe('getStep', () => {
        it('should return 1 for an integer string', () => {
            expect(getStep('42')).toBe(1);
        });

        it('should return 0.1 for one decimal place', () => {
            expect(getStep('1.5')).toBe(0.1);
        });

        it('should return 0.01 for two decimal places', () => {
            expect(getStep('3.14')).toBe(0.01);
        });

        it('should return 0.001 for three decimal places', () => {
            expect(getStep('0.001')).toBe(0.001);
        });

        it('should return 1 for an empty string', () => {
            expect(getStep('')).toBe(1);
        });

        it('should handle comma as decimal separator', () => {
            expect(getStep('1,5')).toBe(0.1);
        });

        it('should return 1 for a string with no decimal separator', () => {
            expect(getStep('100')).toBe(1);
        });
    });

    describe('step precision anchoring', () => {
        it('step matches decimal places of the typed value', () => {
            expect(getStep('1.5')).toBe(0.1);
            expect(getStep('1.50')).toBe(0.01);
            expect(getStep('1.505')).toBe(0.001);
        });

        it('finer precision overrides coarser step (min rule)', () => {
            // Simulates accumulation: user typed '1.5' (step 0.1), then '1.50' (step 0.01).
            // The anchor should take the minimum (finest) step seen so far.
            const stepA = getStep('1.5'); // 0.1
            const stepB = getStep('1.50'); // 0.01
            const anchor = Math.min(stepA, stepB);

            expect(anchor).toBe(0.01);
        });

        it('typing a coarser value resets step', () => {
            // User had '1.50' (step 0.01), then explicitly types '2' (integer).
            // When it is NOT a browser-step delta, the anchor resets to the new precision.
            const prevStep = getStep('1.50'); // 0.01
            const newStep = getStep('2'); // 1

            // isStepping is false here (delta 0.5 ≠ 0.01), so anchor = newStep
            const prevNum = parseFloat('1.50');
            const newNum = parseFloat('2');
            const isStepping =
                !Number.isNaN(prevNum) &&
                !Number.isNaN(newNum) &&
                Math.abs(Math.abs(newNum - prevNum) - prevStep) < prevStep * 1e-4;

            const anchor = isStepping ? Math.min(prevStep, newStep) : newStep;

            expect(isStepping).toBe(false);
            expect(anchor).toBe(1);
        });

        it('browser increment keeps precision anchor sticky', () => {
            // User typed '1.5' (minStep 0.1). Browser increments to '1.6' (delta = 0.1 = minStep).
            // isStepping should be true, so anchor remains 0.1.
            const minStep = getStep('1.5'); // 0.1
            const newStep = getStep('1.6'); // 0.1

            const prevNum = parseFloat('1.5');
            const newNum = parseFloat('1.6');
            const isStepping =
                !Number.isNaN(prevNum) &&
                !Number.isNaN(newNum) &&
                Math.abs(Math.abs(newNum - prevNum) - minStep) < minStep * 1e-4;

            const anchor = isStepping ? Math.min(minStep, newStep) : newStep;

            expect(isStepping).toBe(true);
            expect(anchor).toBe(0.1);
        });

        it('browser increment from high-precision value keeps fine step', () => {
            // User typed '1.505' (minStep 0.001). Browser increments to '1.506'.
            const minStep = getStep('1.505'); // 0.001
            const newStep = getStep('1.506'); // 0.001

            const prevNum = parseFloat('1.505');
            const newNum = parseFloat('1.506');
            const isStepping =
                !Number.isNaN(prevNum) &&
                !Number.isNaN(newNum) &&
                Math.abs(Math.abs(newNum - prevNum) - minStep) < minStep * 1e-4;

            const anchor = isStepping ? Math.min(minStep, newStep) : newStep;

            expect(isStepping).toBe(true);
            expect(anchor).toBe(0.001);
        });

        it('external value reset resets step to match new precision', () => {
            // Simulates what happens in the external value sync effect:
            // prevRawInput and minStep are reset to the new external value's precision.
            const externalValue = ValueTypes.DOUBLE.newValue('7.1');
            const newRaw = externalValue.isNull() ? '' : String(externalValue.getDouble() ?? '');
            const newStep = getStep(newRaw);

            expect(newRaw).toBe('7.1');
            expect(newStep).toBe(0.1);
        });
    });
});
