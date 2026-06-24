import {cn, TextArea, useBlinkAttention} from '@enonic/ui';
import type {JSX} from 'react';
import {useEffect, useRef} from 'react';

import type {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import type {TextAreaConfig} from '../../descriptor';
import {useLocale} from '../../LocaleContext';
import type {InputTypeComponentProps} from '../../types';
import {displayValue, getFirstError, getInputAccessibleName, getLangAttributes} from '../../utils';
import {Counter} from '../counter';

export type TextAreaInputProps = InputTypeComponentProps<TextAreaConfig>;

const TEXT_AREA_INPUT_NAME = 'TextAreaInput';

function valueToString(value: Value): string {
    return value.getString() ?? '';
}

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
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
    // ? Scroll is owned by the parent InputField (gated on RevealOptions.scroll);
    // the inner blink should highlight only, never scroll again.
    const isBlinking = useBlinkAttention(textAreaRef, highlight, {scrollIntoView: false});
    const locale = useLocale();
    const langAttrs = getLangAttributes(locale);

    useEffect(() => {
        if (externalInputRef == null) return undefined;
        externalInputRef(textAreaRef.current);
        return () => externalInputRef(null);
    }, [externalInputRef]);
    const stringValue = displayValue(value, rawValue, valueToString);
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
            <Counter length={stringValue.length} maxLength={maxLength} bottom={true} />
        </div>
    ) : undefined;

    const handleChange = (e: JSX.TargetedEvent<HTMLTextAreaElement>) => {
        const inputValue = e.currentTarget.value;
        onChange(ValueTypes.STRING.newValue(inputValue), inputValue);
    };

    return (
        <TextArea
            ref={textAreaRef}
            {...langAttrs}
            aria-label={getInputAccessibleName(input, index)}
            autoSize
            value={stringValue}
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
            className='min-w-0'
        />
    );
};

TextAreaInput.displayName = TEXT_AREA_INPUT_NAME;
