import {Button, DatePicker, Input, TimePicker} from '@enonic/ui';
import {type JSX, type ReactElement, useMemo, useRef, useState} from 'react';

import {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {DateHelper} from '../../../util/DateHelper';
import {DateTime} from '../../../util/DateTime';
import type {InstantConfig} from '../../descriptor';
import {useI18n} from '../../I18nContext';
import type {InputTypeComponentProps} from '../../types';
import {displayValue, getFirstError, getInputAccessibleName} from '../../utils';

const INSTANT_INPUT_NAME = 'InstantInput';

export type InstantInputProps = InputTypeComponentProps<InstantConfig>;

export function storageToDisplay(s: string): string {
    const date = new Date(s);
    if (Number.isNaN(date.getTime())) return s.replace('T', ' ').replace(/Z$/, '');
    const y = date.getFullYear();
    const m = DateHelper.padNumber(date.getMonth() + 1);
    const d = DateHelper.padNumber(date.getDate());
    const h = DateHelper.padNumber(date.getHours());
    const min = DateHelper.padNumber(date.getMinutes());
    return `${y}-${m}-${d} ${h}:${min}`;
}

export function valueToDisplay(value: Value): string {
    const str = value.getString();
    return str ? storageToDisplay(str) : '';
}

// ? parseDateTime, unlike `new Date`, rejects impossible dates instead of rolling 2025-06-31 into July 1.
// ? DateTime.fromDate then reads UTC parts off the local date, which is the local-to-UTC conversion
export function displayToValue(display: string): Value {
    const parsed = DateHelper.parseDateTime(display);
    if (parsed == null) return ValueTypes.DATE_TIME.newNullValue();

    return new Value(DateTime.fromDate(parsed), ValueTypes.DATE_TIME);
}

function formatTime(date: Date): string {
    return `${DateHelper.padNumber(date.getHours())}:${DateHelper.padNumber(date.getMinutes())}`;
}

function formatDisplay(date: Date, time: string | null): string {
    return `${DateHelper.formatDate(date)} ${time ?? formatTime(date)}`;
}

// ? Offset depends on exact local date+time because DST can change mid-day (e.g. at 02:00)
export function formatTimezoneLabel(date: Date | null, time: string | null): string {
    let ref = date ?? new Date();
    if (date != null && time != null) {
        const [h, m] = time.split(':').map(Number);
        ref = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h ?? 0, m ?? 0);
    }
    const offset = ref.getTimezoneOffset();
    const sign = offset <= 0 ? '+' : '-';
    const absOffset = Math.abs(offset);
    const hours = Math.floor(absOffset / 60);
    const minutes = absOffset % 60;
    return `UTC${sign}${DateHelper.padNumber(hours)}:${DateHelper.padNumber(minutes)}`;
}

export const InstantInput = ({
    value,
    rawValue,
    onChange,
    onBlur,
    config,
    input,
    enabled,
    index,
    errors,
}: InstantInputProps): ReactElement => {
    const [open, setOpen] = useState(false);
    // ? DatePicker/TimePicker API uses null for "no selection"
    const [draftDate, setDraftDate] = useState<Date | null>(null);
    const [draftTime, setDraftTime] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const inputWrapperRef = useRef<HTMLDivElement>(null);
    const t = useI18n();

    const timezoneLabel = useMemo(() => formatTimezoneLabel(draftDate, draftTime), [draftDate, draftTime]);

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
            onChange(ValueTypes.DATE_TIME.newNullValue());
        } else {
            onChange(displayToValue(inputValue), inputValue);
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

    return (
        <DatePicker.Root
            data-component={INSTANT_INPUT_NAME}
            value={open ? draftDate : selected.date}
            onValueChange={handleDraftDateChange}
            closeOnSelect={false}
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
                    ref={inputRef}
                    aria-label={getInputAccessibleName(input, index)}
                    type='text'
                    placeholder={t('field.dateTime.placeholder')}
                    value={display}
                    onChange={handleInputChange}
                    onBlur={onBlur}
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
                                    <span className='text-sm underline'>{timezoneLabel}</span>
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

InstantInput.displayName = INSTANT_INPUT_NAME;
