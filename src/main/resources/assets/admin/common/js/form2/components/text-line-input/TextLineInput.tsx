import {Input} from '@enonic/ui';
import type {JSX} from 'react';
import {useEffect, useRef, useState} from 'react';

import {ValueTypes} from '../../../data/ValueTypes';
import type {TextLineConfig} from '../../descriptor';
import type {InputTypeComponentProps} from '../../types';
import {getFirstError} from '../../utils';
import {Counter} from '../counter';

export type TextLineInputProps = InputTypeComponentProps<TextLineConfig>;

function valueToString(value: TextLineInputProps['value']): string {
    return value.isNull() ? '' : (value.getString() ?? '');
}

const TEXT_LINE_INPUT_NAME = 'TextLineInput';

export const TextLineInput = ({value, onChange, onBlur, config, enabled, errors}: TextLineInputProps): JSX.Element => {
    const [rawInput, setRawInput] = useState(() => valueToString(value));
    const isLocalChange = useRef(false);
    const hasMaxLength = config.maxLength > 0;
    const maxLength = hasMaxLength ? config.maxLength : undefined;
    const hasBoth = hasMaxLength && config.showCounter;

    useEffect(() => {
        if (isLocalChange.current) {
            isLocalChange.current = false;
            return;
        }

        setRawInput(valueToString(value));
    }, [value]);

    const counterAddon = config.showCounter ? (
        <div className='mr-3 self-center'>
            <Counter length={rawInput.length} maxLength={maxLength} />
        </div>
    ) : undefined;

    const handleChange = (e: JSX.TargetedEvent<HTMLInputElement>) => {
        const inputValue = e.currentTarget.value;

        isLocalChange.current = true;
        setRawInput(inputValue);
        onChange(ValueTypes.STRING.newValue(inputValue), inputValue);
    };

    return (
        <Input
            value={rawInput}
            onChange={handleChange}
            onBlur={onBlur}
            disabled={!enabled}
            error={getFirstError(errors)}
            maxLength={hasBoth ? undefined : maxLength}
            endAddon={counterAddon}
        />
    );
};

TextLineInput.displayName = TEXT_LINE_INPUT_NAME;
