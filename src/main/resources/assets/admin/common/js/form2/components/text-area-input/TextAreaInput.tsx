import {TextArea} from '@enonic/ui';
import type {JSX} from 'react';

import {ValueTypes} from '../../../data/ValueTypes';
import type {TextAreaConfig} from '../../descriptor/InputTypeConfig';
import type {InputTypeComponentProps} from '../../types';
import {getFirstError} from '../../utils';
import {CounterDescription} from '../counter-description/CounterDescription';

const TEXT_AREA_INPUT_NAME = 'TextAreaInput';

export const TextAreaInput = ({
    value,
    onChange,
    onBlur,
    config,
    enabled,
    errors,
}: InputTypeComponentProps<TextAreaConfig>): JSX.Element => {
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
};

TextAreaInput.displayName = TEXT_AREA_INPUT_NAME;
