import {Input} from '@enonic/ui';
import type {JSX, ReactElement} from 'react';
import {useEffect, useRef, useState} from 'react';

import {ValueTypes} from '../../../data/ValueTypes';
import type {NumberConfig} from '../../descriptor/InputTypeConfig';
import type {InputTypeComponentProps} from '../../types';
import {getFirstError} from '../../utils';

const LONG_INPUT_NAME = 'LongInput';

export type LongInputProps = InputTypeComponentProps<NumberConfig>;

function valueToString(value: LongInputProps['value']): string {
    return value.isNull() ? '' : String(value.getLong() ?? '');
}

export const LongInput = ({value, onChange, onBlur, config, enabled, errors}: LongInputProps): ReactElement => {
    const [rawInput, setRawInput] = useState(() => valueToString(value));
    const isLocalChange = useRef(false);

    // Sync from parent only on external value changes (e.g. form reset).
    // Skip when the change was triggered by handleChange below.
    useEffect(() => {
        if (isLocalChange.current) {
            isLocalChange.current = false;
            return;
        }
        setRawInput(valueToString(value));
    }, [value]);

    const handleChange = (e: JSX.TargetedEvent<HTMLInputElement>) => {
        const inputValue = e.currentTarget.value;
        isLocalChange.current = true;
        setRawInput(inputValue);
        if (inputValue === '') {
            onChange(ValueTypes.LONG.newNullValue());
        } else {
            onChange(ValueTypes.LONG.newValue(inputValue), inputValue);
        }
    };

    return (
        <Input
            data-component={LONG_INPUT_NAME}
            type='number'
            step={1}
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

LongInput.displayName = LONG_INPUT_NAME;
