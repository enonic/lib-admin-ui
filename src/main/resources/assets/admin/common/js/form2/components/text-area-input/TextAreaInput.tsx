import {cn, TextArea, useBlinkAttention} from '@enonic/ui';
import type {CSSProperties, JSX} from 'react';
import {useEffect, useRef, useState} from 'react';

import {ValueTypes} from '../../../data/ValueTypes';
import type {TextAreaConfig} from '../../descriptor';
import {useLocale} from '../../LocaleContext';
import type {InputTypeComponentProps} from '../../types';
import {getFirstError, getInputAccessibleName, getLangAttributes} from '../../utils';
import {Counter} from '../counter';

export type TextAreaInputProps = InputTypeComponentProps<TextAreaConfig>;

function valueToString(value: TextAreaInputProps['value']): string {
    return value.isNull() ? '' : (value.getString() ?? '');
}

function displayValue(value: TextAreaInputProps['value'], rawValue?: string): string {
    return value.isNull() && rawValue != null ? rawValue : valueToString(value);
}

const TEXT_AREA_INPUT_NAME = 'TextAreaInput';
const TEXT_AREA_STYLE: CSSProperties & {fieldSizing: 'content'} = {
    fieldSizing: 'content',
    maxWidth: '100%',
    minWidth: 0,
    overflowWrap: 'anywhere',
    width: '100%',
    wordBreak: 'break-word',
};

export const TextAreaInput = ({
    value,
    rawValue,
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
    highlight,
    inputRef: externalInputRef,
}: TextAreaInputProps): JSX.Element => {
    const [rawInput, setRawInput] = useState(() => displayValue(value, rawValue));
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
    // ? Scroll is owned by the parent InputField (gated on RevealOptions.scroll);
    // the inner blink should highlight only, never scroll again.
    const isBlinking = useBlinkAttention(textAreaRef, highlight, {scrollIntoView: false});
    const locale = useLocale();
    const langAttrs = getLangAttributes(locale);

    useEffect(() => {
        setRawInput(displayValue(value, rawValue));
    }, [value, rawValue]);

    useEffect(() => {
        if (externalInputRef == null) return undefined;
        externalInputRef(textAreaRef.current);
        return () => externalInputRef(null);
    }, [externalInputRef]);
    const hasMaxLength = config.maxLength > 0;
    const maxLength = hasMaxLength ? config.maxLength : undefined;
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
            <Counter length={rawInput.length} maxLength={maxLength} bottom={true} />
        </div>
    ) : undefined;

    const handleChange = (e: JSX.TargetedEvent<HTMLTextAreaElement>) => {
        const inputValue = e.currentTarget.value;

        setRawInput(inputValue);
        onChange(ValueTypes.STRING.newValue(inputValue), inputValue);
    };

    return (
        <TextArea
            ref={textAreaRef}
            {...langAttrs}
            aria-label={getInputAccessibleName(input, index)}
            autoSize
            className='min-w-0'
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
            endAddon={counterAddon}
            style={TEXT_AREA_STYLE}
            wrap='soft'
        />
    );
};

TextAreaInput.displayName = TEXT_AREA_INPUT_NAME;
