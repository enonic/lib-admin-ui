import {cn, TextArea, useBlinkAttention} from '@enonic/ui';
import type {JSX} from 'react';
import {useRef} from 'react';

import {ValueTypes} from '../../../data/ValueTypes';
import type {TextAreaConfig} from '../../descriptor';
import type {InputTypeComponentProps} from '../../types';
import {getFirstError, getInputAccessibleName} from '../../utils';
import {Counter} from '../counter';

export type TextAreaInputProps = InputTypeComponentProps<TextAreaConfig> & {
    readOnly?: boolean;
    processing?: boolean;
    highlight?: boolean;
};

const TEXT_AREA_INPUT_NAME = 'TextAreaInput';

export const TextAreaInput = ({
    value,
    onChange,
    onBlur,
    config,
    input,
    enabled,
    index,
    errors,
    readOnly = false,
    processing = false,
    highlight = false,
}: TextAreaInputProps): JSX.Element => {
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
    const isBlinking = useBlinkAttention(textAreaRef, highlight);
    const stringValue = value.isNull() ? '' : (value.getString() ?? '');
    const hasMaxLength = config.maxLength > 0;
    const maxLength = hasMaxLength ? config.maxLength : undefined;
    const hasBoth = hasMaxLength && config.showCounter;
    const effectiveReadOnly = readOnly || processing;

    const counterAddon = config.showCounter ? (
        <div
            className={cn(
                'absolute right-0 bottom-0 items-center',
                effectiveReadOnly ? 'bg-transparent' : 'bg-surface-primary/50',
                'text-sm tabular-nums',
                'rounded-tl-sm rounded-br-sm px-1.5 py-0.5',
            )}
        >
            <Counter length={stringValue.length} maxLength={maxLength} bottom={true} />
        </div>
    ) : undefined;

    const handleChange = (e: JSX.TargetedEvent<HTMLTextAreaElement>) => {
        onChange(ValueTypes.STRING.newValue(e.currentTarget.value));
    };

    return (
        <TextArea
            ref={textAreaRef}
            aria-label={getInputAccessibleName(input, index)}
            autoSize
            value={stringValue}
            onChange={handleChange}
            onBlur={onBlur}
            disabled={!enabled}
            readOnly={readOnly}
            processing={processing}
            highlight={isBlinking}
            error={getFirstError(errors)}
            maxLength={hasBoth ? undefined : maxLength}
            endAddon={counterAddon}
        />
    );
};

TextAreaInput.displayName = TEXT_AREA_INPUT_NAME;
