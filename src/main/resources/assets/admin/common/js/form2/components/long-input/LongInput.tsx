import {Input} from '@enonic/ui';
import type {JSX, ReactElement} from 'react';

import type {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import type {NumberConfig} from '../../descriptor';
import type {InputTypeComponentProps} from '../../types';
import {displayValue, getFirstError, getInputAccessibleName} from '../../utils';

const LONG_INPUT_NAME = 'LongInput';

export type LongInputProps = InputTypeComponentProps<NumberConfig>;

function valueToString(value: Value): string {
    return String(value.getLong() ?? '');
}

export const LongInput = ({
    value,
    rawValue,
    onChange,
    onBlur,
    config,
    input,
    enabled,
    index,
    errors,
}: LongInputProps): ReactElement => {
    const display = displayValue(value, rawValue, valueToString);

    const handleChange = (e: JSX.TargetedEvent<HTMLInputElement>) => {
        const inputValue = e.currentTarget.value;
        if (inputValue === '') {
            onChange(ValueTypes.LONG.newNullValue());
        } else {
            onChange(ValueTypes.LONG.newValue(inputValue), inputValue);
        }
    };

    return (
        <Input
            data-component={LONG_INPUT_NAME}
            aria-label={getInputAccessibleName(input, index)}
            type='number'
            step={1}
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

LongInput.displayName = LONG_INPUT_NAME;
