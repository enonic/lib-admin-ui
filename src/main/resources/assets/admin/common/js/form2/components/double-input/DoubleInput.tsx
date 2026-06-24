import {Input} from '@enonic/ui';
import {type JSX, type ReactElement, useEffect, useRef, useState} from 'react';

import type {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import type {NumberConfig} from '../../descriptor';
import type {InputTypeComponentProps} from '../../types';
import {displayValue, getFirstError, getInputAccessibleName} from '../../utils';
import {getStep} from './utils';

const DOUBLE_INPUT_NAME = 'DoubleInput';

export type DoubleInputProps = InputTypeComponentProps<NumberConfig>;

function valueToString(value: Value): string {
    return String(value.getDouble() ?? '');
}

export const DoubleInput = ({
    value,
    rawValue,
    onChange,
    onBlur,
    config,
    input,
    enabled,
    index,
    errors,
}: DoubleInputProps): ReactElement => {
    const display = displayValue(value, rawValue, valueToString);
    // ? Step is precision-sticky: shrinks to match user-typed decimals, but holds steady
    //   through browser increment/decrement clicks so 0.001 + 0.001 stays at 0.001 precision.
    const minStep = useRef(getStep(display));
    const prevDisplay = useRef(display);
    const [step, setStep] = useState(minStep.current);

    useEffect(() => {
        const newStep = getStep(display);
        const prevNum = parseFloat(prevDisplay.current);
        const newNum = parseFloat(display);
        // If the numeric delta matches the current step, the change came from the
        // browser's increment/decrement control — keep the precision anchor sticky.
        // Otherwise the user typed a new value directly, so reset to match it.
        const isStepping =
            !Number.isNaN(prevNum) &&
            !Number.isNaN(newNum) &&
            Math.abs(Math.abs(newNum - prevNum) - minStep.current) < minStep.current * 1e-4;

        minStep.current = isStepping ? Math.min(minStep.current, newStep) : newStep;
        prevDisplay.current = display;
        setStep(minStep.current);
    }, [display]);

    const handleChange = (e: JSX.TargetedEvent<HTMLInputElement>) => {
        const inputValue = e.currentTarget.value;
        if (inputValue === '') {
            onChange(ValueTypes.DOUBLE.newNullValue());
        } else {
            onChange(ValueTypes.DOUBLE.newValue(inputValue), inputValue);
        }
    };

    return (
        <Input
            data-component={DOUBLE_INPUT_NAME}
            aria-label={getInputAccessibleName(input, index)}
            type='number'
            step={step}
            value={display}
            onChange={handleChange}
            onBlur={onBlur}
            disabled={!enabled}
            error={getFirstError(errors)}
            min={config.min}
            max={config.max}
        />
    );
};

DoubleInput.displayName = DOUBLE_INPUT_NAME;
