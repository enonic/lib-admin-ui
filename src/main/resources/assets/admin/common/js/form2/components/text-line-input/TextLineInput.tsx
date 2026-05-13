import {cn, Input, useBlinkAttention} from '@enonic/ui';
import type {JSX} from 'react';
import {useEffect, useRef, useState} from 'react';

import {ValueTypes} from '../../../data/ValueTypes';
import type {TextLineConfig} from '../../descriptor';
import type {InputTypeComponentProps} from '../../types';
import {getFirstError, getInputAccessibleName} from '../../utils';
import {Counter} from '../counter';

export type TextLineInputProps = InputTypeComponentProps<TextLineConfig> & {
    highlight?: boolean;
};

function valueToString(value: TextLineInputProps['value']): string {
    return value.isNull() ? '' : (value.getString() ?? '');
}

const TEXT_LINE_INPUT_NAME = 'TextLineInput';

export const TextLineInput = ({
    value,
    onChange,
    onBlur,
    onFocus,
    config,
    input,
    enabled,
    index,
    errors,
    readOnly = false,
    processing = false,
    highlight = false,
    inputRef: externalInputRef,
}: TextLineInputProps): JSX.Element => {
    const [rawInput, setRawInput] = useState(() => valueToString(value));
    const isLocalChange = useRef(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const isBlinking = useBlinkAttention(inputRef, highlight);
    const hasMaxLength = config.maxLength > 0;
    const maxLength = hasMaxLength ? config.maxLength : undefined;
    const hasBoth = hasMaxLength && config.showCounter;
    const effectiveReadOnly = readOnly || processing;

    useEffect(() => {
        if (isLocalChange.current) {
            isLocalChange.current = false;
            return;
        }

        setRawInput(valueToString(value));
    }, [value]);

    useEffect(() => {
        if (externalInputRef == null) return undefined;
        externalInputRef(inputRef.current);
        return () => externalInputRef(null);
    }, [externalInputRef]);

    const counterAddon = config.showCounter ? (
        <div
            className={cn(
                'flex items-center self-stretch pr-3 pl-2',
                effectiveReadOnly ? 'bg-surface-primary' : 'bg-surface-neutral',
            )}
        >
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
            ref={inputRef}
            aria-label={getInputAccessibleName(input, index)}
            value={rawInput}
            onChange={handleChange}
            onBlur={onBlur}
            onFocus={onFocus}
            disabled={!enabled}
            readOnly={readOnly}
            processing={processing}
            tabIndex={processing ? -1 : undefined}
            highlight={isBlinking}
            error={getFirstError(errors)}
            maxLength={hasBoth ? undefined : maxLength}
            endAddon={counterAddon}
        />
    );
};

TextLineInput.displayName = TEXT_LINE_INPUT_NAME;
