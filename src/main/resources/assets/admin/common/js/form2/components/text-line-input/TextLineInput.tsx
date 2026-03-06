import {Input} from '@enonic/ui';
import type {JSX} from 'react';

import {ValueTypes} from '../../../data/ValueTypes';
import type {TextLineConfig} from '../../descriptor';
import type {InputTypeComponentProps} from '../../types';
import {getFirstError} from '../../utils';
import {Counter} from '../counter';

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
    const hasMaxLength = config.maxLength > 0;
    const maxLength = hasMaxLength ? config.maxLength : undefined;
    const hasBoth = hasMaxLength && config.showCounter;

    const counterAddon = config.showCounter ? (
        <div className='mr-3 self-center'>
            <Counter length={stringValue.length} maxLength={maxLength} />
        </div>
    ) : undefined;

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
            maxLength={hasBoth ? undefined : maxLength}
            endAddon={counterAddon}
        />
    );
};

TextLineInput.displayName = TEXT_LINE_INPUT_NAME;
