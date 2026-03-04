import {Input} from '@enonic/ui';
import {type JSX, type ReactElement, useEffect, useRef, useState} from 'react';
import {ValueTypes} from '../../../data/ValueTypes';
import type {NumberConfig} from '../../descriptor';
import type {InputTypeComponentProps} from '../../types';
import {getFirstError} from '../../utils';
import {getStep} from './utils';

const DOUBLE_INPUT_NAME = 'DoubleInput';

export type DoubleInputProps = InputTypeComponentProps<NumberConfig>;

function valueToString(value: DoubleInputProps['value']): string {
    return value.isNull() ? '' : String(value.getDouble() ?? '');
}

export const DoubleInput = ({value, onChange, onBlur, config, enabled, errors}: DoubleInputProps): ReactElement => {
    const [rawInput, setRawInput] = useState(() => valueToString(value));
    const minStep = useRef(getStep(rawInput));
    const prevRawInput = useRef(rawInput);
    const [step, setStep] = useState(minStep.current);
    const isLocalChange = useRef(false);

    // Sync from parent only on external value changes (e.g. form reset).
    // Skip when the change was triggered by handleChange below.
    useEffect(() => {
        if (isLocalChange.current) {
            isLocalChange.current = false;
            return;
        }
        const newRaw = valueToString(value);
        minStep.current = getStep(newRaw);
        prevRawInput.current = newRaw;
        setRawInput(newRaw);
    }, [value]);

    useEffect(() => {
        const newStep = getStep(rawInput);
        const prevNum = parseFloat(prevRawInput.current);
        const newNum = parseFloat(rawInput);
        // If the numeric delta matches the current step, the change came from the
        // browser's increment/decrement control — keep the precision anchor sticky.
        // Otherwise the user typed a new value directly, so reset to match it.
        const isStepping =
            !Number.isNaN(prevNum) &&
            !Number.isNaN(newNum) &&
            Math.abs(Math.abs(newNum - prevNum) - minStep.current) < minStep.current * 1e-4;

        minStep.current = isStepping ? Math.min(minStep.current, newStep) : newStep;
        prevRawInput.current = rawInput;
        setStep(minStep.current);
    }, [rawInput]);

    const handleChange = (e: JSX.TargetedEvent<HTMLInputElement>) => {
        const inputValue = e.currentTarget.value;
        isLocalChange.current = true;

        setRawInput(inputValue);
        if (inputValue === '') {
            onChange(ValueTypes.DOUBLE.newNullValue());
        } else {
            onChange(ValueTypes.DOUBLE.newValue(inputValue), inputValue);
        }
    };

    return (
        <Input
            data-component={DOUBLE_INPUT_NAME}
            type='number'
            step={step}
            value={rawInput}
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
