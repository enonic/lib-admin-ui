import {TextArea} from '@enonic/ui';
import type {JSX} from 'preact';

import {ValueTypes} from '../../data/ValueTypes';
import {CounterDescription} from './CounterDescription';
import type {TextAreaConfig} from './descriptor/InputTypeConfig';
import type {InputTypeComponentProps} from './types';
import {getFirstError} from './types';

export function TextAreaInput({
    value,
    onChange,
    onBlur,
    config,
    enabled,
    errors,
}: InputTypeComponentProps<TextAreaConfig>) {
    const stringValue = value.isNull() ? '' : (value.getString() ?? '');

    const handleChange = (e: JSX.TargetedEvent<HTMLTextAreaElement>) => {
        onChange(ValueTypes.STRING.newValue(e.currentTarget.value));
    };

    return (
        <TextArea
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
}
