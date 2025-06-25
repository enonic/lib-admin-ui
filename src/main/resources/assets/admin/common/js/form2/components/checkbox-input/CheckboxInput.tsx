import {Checkbox} from '@enonic/ui';
import type {ReactElement} from 'react';

import {ValueTypes} from '../../../data/ValueTypes';
import type {Alignment, CheckboxConfig} from '../../descriptor/InputTypeConfig';
import type {InputTypeComponentProps} from '../../types';
import {getFirstError} from '../../utils';

const CHECKBOX_INPUT_NAME = 'CheckboxInput';

const ALIGNMENT_CLASSES: Record<Alignment, string | undefined> = {
    LEFT: undefined,
    RIGHT: 'flex-row-reverse justify-end',
    TOP: 'flex-col items-start',
    BOTTOM: 'flex-col-reverse items-start',
};

export type CheckboxInputProps = InputTypeComponentProps<CheckboxConfig>;

export const CheckboxInput = ({value, onChange, config, input, enabled, errors}: CheckboxInputProps): ReactElement => {
    const isChecked = value.isNull() ? false : (value.getBoolean() ?? false);
    const isRequired = input.getOccurrences().getMinimum() > 0;

    const handleCheckedChange = (checked: boolean | 'indeterminate') => {
        if (checked === true) {
            onChange(ValueTypes.BOOLEAN.fromJsonValue(true));
        } else {
            onChange(isRequired ? ValueTypes.BOOLEAN.newNullValue() : ValueTypes.BOOLEAN.fromJsonValue(false));
        }
    };

    return (
        <div data-component={CHECKBOX_INPUT_NAME}>
            <Checkbox
                checked={isChecked}
                label={input.getLabel()}
                className={ALIGNMENT_CLASSES[config.alignment]}
                disabled={!enabled}
                error={errors.length > 0}
                errorMessage={getFirstError(errors)}
                onCheckedChange={handleCheckedChange}
            />
        </div>
    );
};

CheckboxInput.displayName = CHECKBOX_INPUT_NAME;
