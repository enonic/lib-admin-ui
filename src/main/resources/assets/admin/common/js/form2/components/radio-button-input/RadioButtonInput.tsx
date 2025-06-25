import {RadioGroup} from '@enonic/ui';
import type {ReactElement} from 'react';

import {ValueTypes} from '../../../data/ValueTypes';
import type {RadioButtonConfig} from '../../descriptor/InputTypeConfig';
import type {InputTypeComponentProps} from '../../types';
import {getFirstError} from '../../utils';
import {InputLabel} from '../input-label';

const RADIO_BUTTON_INPUT_NAME = 'RadioButtonInput';

export const RadioButtonInput = ({
    value,
    onChange,
    onBlur,
    config,
    input,
    enabled,
    index,
    errors,
}: InputTypeComponentProps<RadioButtonConfig>): ReactElement => {
    const stringValue = value.isNull() ? '' : (value.getString() ?? '');
    const hasErrors = errors.length > 0;

    const handleValueChange = (newValue: string): void => {
        onChange(ValueTypes.STRING.newValue(newValue));
    };

    return (
        <div data-component={RADIO_BUTTON_INPUT_NAME}>
            <InputLabel input={input} />
            <RadioGroup
                name={`${input.getName()}-${index}`}
                value={stringValue}
                onValueChange={handleValueChange}
                onBlur={onBlur}
                error={hasErrors}
                errorMessage={getFirstError(errors)}
            >
                {config.options.map(option => (
                    <RadioGroup.Item key={option.value} value={option.value} disabled={!enabled}>
                        <RadioGroup.Indicator />
                        {option.label}
                    </RadioGroup.Item>
                ))}
            </RadioGroup>
        </div>
    );
};

RadioButtonInput.displayName = RADIO_BUTTON_INPUT_NAME;
