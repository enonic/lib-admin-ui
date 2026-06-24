import {cn, Input, useBlinkAttention} from '@enonic/ui';
import type {JSX} from 'react';
import {useEffect, useRef} from 'react';

import type {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import type {TextLineConfig} from '../../descriptor';
import {useLocale} from '../../LocaleContext';
import type {InputTypeComponentProps} from '../../types';
import {displayValue, getFirstError, getInputAccessibleName, getLangAttributes} from '../../utils';
import {Counter} from '../counter';

export type TextLineInputProps = InputTypeComponentProps<TextLineConfig>;

function valueToString(value: Value): string {
    return value.getString() ?? '';
}

const TEXT_LINE_INPUT_NAME = 'TextLineInput';

export const TextLineInput = ({
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
}: TextLineInputProps): JSX.Element => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    // ? Scroll is owned by the parent InputField (gated on RevealOptions.scroll);
    // the inner blink should highlight only, never scroll again.
    const isBlinking = useBlinkAttention(inputRef, highlight, {scrollIntoView: false});
    const locale = useLocale();
    const langAttrs = getLangAttributes(locale);
    const hasMaxLength = config.maxLength > 0;
    const maxLength = hasMaxLength ? config.maxLength : undefined;
    const effectiveReadOnly = readOnly || processing;

    useEffect(() => {
        if (externalInputRef == null) return undefined;
        externalInputRef(inputRef.current);
        return () => externalInputRef(null);
    }, [externalInputRef]);

    const display = displayValue(value, rawValue, valueToString);

    const counterAddon = config.showCounter ? (
        <div
            className={cn(
                'flex items-center self-stretch pr-3 pl-2',
                effectiveReadOnly ? 'bg-surface-primary' : 'bg-surface-neutral',
            )}
        >
            <Counter length={display.length} maxLength={maxLength} />
        </div>
    ) : undefined;

    const handleChange = (e: JSX.TargetedEvent<HTMLInputElement>) => {
        const inputValue = e.currentTarget.value;
        onChange(ValueTypes.STRING.newValue(inputValue), inputValue);
    };

    return (
        <Input
            ref={inputRef}
            {...langAttrs}
            aria-label={getInputAccessibleName(input, index)}
            value={display}
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
        />
    );
};

TextLineInput.displayName = TEXT_LINE_INPUT_NAME;
