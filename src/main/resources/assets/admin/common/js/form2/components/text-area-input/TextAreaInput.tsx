import {cn, TextArea, useBlinkAttention} from '@enonic/ui';
import type {JSX} from 'react';
import {useEffect, useRef} from 'react';

import {ValueTypes} from '../../../data/ValueTypes';
import type {TextAreaConfig} from '../../descriptor';
import {useLocale} from '../../LocaleContext';
import type {InputTypeComponentProps} from '../../types';
import {getFirstError, getInputAccessibleName, getLangAttributes} from '../../utils';
import {Counter} from '../counter';

export type TextAreaInputProps = InputTypeComponentProps<TextAreaConfig>;

const TEXT_AREA_INPUT_NAME = 'TextAreaInput';

export const TextAreaInput = ({
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
            maxLength={hasBoth ? undefined : maxLength}
            endAddon={counterAddon}
            className='min-w-0'
        />
    );
};

TextAreaInput.displayName = TEXT_AREA_INPUT_NAME;
