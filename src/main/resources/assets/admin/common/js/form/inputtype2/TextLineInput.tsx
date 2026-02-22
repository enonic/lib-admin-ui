import {Input} from '@enonic/ui';
import type {JSX} from 'react';

import {ValueTypes} from '../../data/ValueTypes';
import {CounterDescription} from './CounterDescription';
import type {TextLineConfig} from './descriptor/InputTypeConfig';
import type {InputTypeComponentProps} from './types';
import {getFirstError} from './types';

const TEXT_LINE_INPUT_NAME = 'TextLineInput';

export const TextLineInput = ({
    value,
    onChange,
    onBlur,
    config,
    enabled,
    errors,
}: InputTypeComponentProps<TextLineConfig>): JSX.Element => {
    const stringValue = value.isNull() ? '' : (value.getString() ?? '');

    const handleChange = (e: JSX.TargetedEvent<HTMLInputElement>) => {
        onChange(ValueTypes.STRING.newValue(e.currentTarget.value));
    };

    return (
        <Input
            value={stringValue}
            onChange={handleChange}
            onBlur={onBlur}
            disabled={!enabled}
            error={getFirstError(errors)}
            maxLength={config.maxLength > 0 ? config.maxLength : undefined}
            description={
                config.maxLength > 0 || config.showCounter ? (
                    <CounterDescription
                        length={stringValue.length}
                        maxLength={config.maxLength}
                        showCounter={config.showCounter}
                    />
                ) : undefined
            }
        />
    );
};

TextLineInput.displayName = TEXT_LINE_INPUT_NAME;
