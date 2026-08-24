import {Button, DatePicker, Input, TimePicker} from '@enonic/ui';
import {type JSX, type ReactElement, useCallback, useMemo, useRef, useState} from 'react';

import {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {DateHelper} from '../../../util/DateHelper';
import {LocalDateTime} from '../../../util/LocalDateTime';
import type {DateTimeConfig} from '../../descriptor';
import {truncateToMinutes} from '../../descriptor/DateTimeDescriptor';
import {useIsMobile} from '../../hooks/useIsMobile';
import {useI18n} from '../../I18nContext';
import type {InputTypeComponentProps} from '../../types';
import {displayValue, getFirstError, getInputAccessibleName, handleMobileCompletionKeyDown} from '../../utils';

const DATE_TIME_INPUT_NAME = 'DateTimeInput';

export type DateTimeInputProps = InputTypeComponentProps<DateTimeConfig>;

function storageToDisplay(s: string): string {
    return s.replace('T', ' ');
}

export function valueToDisplay(value: Value): string {
    const str = value.getString();
    return str ? storageToDisplay(truncateToMinutes(str)) : '';
}

// ? parseDateTime, unlike `new Date`, rejects impossible dates instead of rolling 2025-06-31 into July 1
export function displayToValue(display: string): Value {
    const parsed = DateHelper.parseDateTime(display);
    if (parsed == null) return ValueTypes.LOCAL_DATE_TIME.newNullValue();

    return new Value(LocalDateTime.fromDate(parsed), ValueTypes.LOCAL_DATE_TIME);
}

function formatTime(date: Date): string {
    return `${DateHelper.padNumber(date.getHours())}:${DateHelper.padNumber(date.getMinutes())}`;
}

function formatDisplay(date: Date, time: string | null): string {
    return `${DateHelper.formatDate(date)} ${time ?? formatTime(date)}`;
}

export const DateTimeInput = ({
    value,
    rawValue,
    onChange,
    onBlur,
    onMobileComplete,
    config,
    input,
    enabled,
    index,
    errors,
    inputRef: externalInputRef,
}: DateTimeInputProps): ReactElement => {
    const [open, setOpen] = useState(false);
    // ? DatePicker/TimePicker API uses null for "no selection"
    const [draftDate, setDraftDate] = useState<Date | null>(null);
    const [draftTime, setDraftTime] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const inputWrapperRef = useRef<HTMLDivElement>(null);
    const t = useI18n();
    const isMobile = useIsMobile();
    const setInputRef = useCallback(
        (element: HTMLInputElement | null) => {
            inputRef.current = element;
            externalInputRef?.(element);
        },
        [externalInputRef],
    );

    const display = displayValue(value, rawValue, valueToDisplay);

    const selected = useMemo(() => {
        const parsed = DateHelper.parseDateTime(display);
        if (parsed == null) return {date: null, time: null};

        return {
            date: new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()),
            time: formatTime(parsed),
        };
    }, [display]);

    const handleInputChange = (e: JSX.TargetedEvent<HTMLInputElement>) => {
        const inputValue = e.currentTarget.value;
        if (inputValue === '') {
            onChange(ValueTypes.LOCAL_DATE_TIME.newNullValue());
        } else {
            onChange(displayToValue(inputValue), inputValue);
        }
    };

    const handleNativeInputChange = (e: JSX.TargetedEvent<HTMLInputElement>) => {
        const inputValue = e.currentTarget.value;
        if (inputValue === '') {
            onChange(ValueTypes.LOCAL_DATE_TIME.newNullValue());
        } else {
            const displayValueStr = storageToDisplay(inputValue);
            onChange(displayToValue(displayValueStr), displayValueStr);
        }
    };

    const handleDraftDateChange = (date: Date | null) => {
        setDraftDate(date);
    };

    const handleDraftTimeChange = (time: string | null) => {
        setDraftTime(time);
    };

    const handleConfirm = () => {
        if (draftDate == null) return;
        const displayValueStr = formatDisplay(draftDate, draftTime);
        onChange(displayToValue(displayValueStr), displayValueStr);
        setOpen(false);
        inputRef.current?.focus();
    };

    const handleSetDefault = () => {
        if (config.default == null) return;
        setDraftDate(config.default);
        setDraftTime(formatTime(config.default));
    };

    if (isMobile) {
        const nativeValue =
            selected.date != null && selected.time != null
                ? `${DateHelper.formatDate(selected.date)}T${selected.time}`
                : '';

        return (
            <div data-component={DATE_TIME_INPUT_NAME}>
                <Input
                    ref={setInputRef}
                    data-mobile-focus-target
                    aria-label={getInputAccessibleName(input, index)}
                    type='datetime-local'
                    step={60}
                    value={nativeValue}
                    onChange={handleNativeInputChange}
                    onBlur={onBlur}
                    enterKeyHint={onMobileComplete ? 'next' : undefined}
                    onKeyDown={
                        onMobileComplete ? event => handleMobileCompletionKeyDown(event, onMobileComplete) : undefined
                    }
                    disabled={!enabled}
                    error={getFirstError(errors)}
                />
            </div>
        );
    }

    return (
        <DatePicker.Root
            data-component={DATE_TIME_INPUT_NAME}
            value={open ? draftDate : selected.date}
            onValueChange={handleDraftDateChange}
            closeOnSelect={false}
            native={false}
            open={open}
            onOpenChange={isOpen => {
                if (isOpen) {
                    setDraftDate(selected.date);
                    setDraftTime(selected.time ?? formatTime(new Date()));
                }
                setOpen(isOpen);
            }}
            focusOnCloseRef={inputRef}
        >
            <div ref={inputWrapperRef}>
                <Input
                    ref={setInputRef}
                    data-mobile-focus-target
                    aria-label={getInputAccessibleName(input, index)}
                    type='text'
                    placeholder={t('field.dateTime.placeholder')}
                    value={display}
                    onChange={handleInputChange}
                    onBlur={onBlur}
                    enterKeyHint={onMobileComplete ? 'next' : undefined}
                    onKeyDown={
                        onMobileComplete ? event => handleMobileCompletionKeyDown(event, onMobileComplete) : undefined
                    }
                    disabled={!enabled}
                    error={getFirstError(errors)}
                    endAddon={
                        <div className='flex h-full w-11 items-center justify-center bg-transparent'>
                            <DatePicker.Trigger disabled={!enabled} aria-label={t('field.dateTime.trigger')} />
                        </div>
                    }
                />
            </div>
            <DatePicker.Portal>
                <DatePicker.Content anchorRef={inputWrapperRef} align='end'>
                    <div className='flex flex-col gap-4'>
                        <div className='flex flex-col gap-2'>
                            <DatePicker.Header />
                            <div className='flex flex-col gap-2'>
                                <DatePicker.Weekdays />
                                <DatePicker.Grid />
                            </div>
                        </div>
                        <div className='border-bdr-soft border-t pt-3'>
                            <TimePicker value={draftTime} onValueChange={handleDraftTimeChange}>
                                <div className='flex items-center gap-2'>
                                    <TimePicker.HourSelect className='w-20' />
                                    <span className='font-bold text-lg text-main'>:</span>
                                    <TimePicker.MinuteSelect className='w-20' />
                                </div>
                            </TimePicker>
                            <div className='mt-3 flex items-center gap-3'>
                                {config.default != null && (
                                    <Button variant='solid' size='sm' onClick={handleSetDefault}>
                                        {t('action.setDefault')}
                                    </Button>
                                )}
                                <Button
                                    className='ml-auto'
                                    variant='solid'
                                    size='sm'
                                    onClick={handleConfirm}
                                    disabled={draftDate == null}
                                >
                                    {t('action.ok')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DatePicker.Content>
            </DatePicker.Portal>
        </DatePicker.Root>
    );
};

DateTimeInput.displayName = DATE_TIME_INPUT_NAME;
