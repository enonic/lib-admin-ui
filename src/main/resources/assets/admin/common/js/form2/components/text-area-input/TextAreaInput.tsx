import {cn, TextArea} from '@enonic/ui';
import type {JSX} from 'react';

import {ValueTypes} from '../../../data/ValueTypes';
import type {TextAreaConfig} from '../../descriptor';
import type {InputTypeComponentProps} from '../../types';
import {getFirstError} from '../../utils';
import {Counter} from '../counter-description';

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
    const hasMaxLength = config.maxLength > 0;
    const maxLength = hasMaxLength ? config.maxLength : undefined;
    const displayCounter = hasMaxLength || config.showCounter;

    const counterAddon = displayCounter ? (
        <div
            className={cn(
                'absolute right-0 bottom-0 items-center',
                'bg-surface-primary/50 text-sm tabular-nums',
                'rounded-tl-sm rounded-br-sm px-1.5 py-0.5',
            )}
        >
            <Counter length={stringValue.length} maxLength={maxLength} showCounter={config.showCounter} bottom={true} />
        </div>
    ) : undefined;

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
            maxLength={maxLength}
            endAddon={counterAddon}
        />
    );
};

TextAreaInput.displayName = TEXT_AREA_INPUT_NAME;
