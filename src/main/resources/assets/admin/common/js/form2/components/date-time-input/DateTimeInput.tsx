import {Button, DatePicker, Input, TimePicker} from '@enonic/ui';
import {type JSX, type ReactElement, useEffect, useRef, useState} from 'react';

import {ValueTypes} from '../../../data/ValueTypes';
import {DateHelper} from '../../../util/DateHelper';
import type {DateTimeConfig} from '../../descriptor/InputTypeConfig';
import {useI18n} from '../../I18nContext';
import type {InputTypeComponentProps} from '../../types';
import {getFirstError} from '../../utils/validation';

const DATE_TIME_INPUT_NAME = 'DateTimeInput';

// ? Display uses space separator (2025-06-15 14:30), storage uses T (2025-06-15T14:30)
const DISPLAY_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

export type DateTimeInputProps = InputTypeComponentProps<DateTimeConfig>;

function storageToDisplay(s: string): string {
    return s.replace('T', ' ');
}

function displayToStorage(s: string): string {
    return s.replace(' ', 'T');
}

function valueToDisplay(value: DateTimeInputProps['value']): string {
    if (value.isNull()) return '';
    const str = value.getString();
    return str ? storageToDisplay(str) : '';
}

function formatDisplay(date: Date, time: string | null): string {
    const datePart = DateHelper.formatDate(date);
    const timePart = time ?? `${DateHelper.padNumber(date.getHours())}:${DateHelper.padNumber(date.getMinutes())}`;
    return `${datePart} ${timePart}`;
}

function parseDateFromDisplay(raw: string): Date | null {
    if (!DISPLAY_PATTERN.test(raw)) return null;
    const datePart = raw.slice(0, 10);
    const parsed = new Date(`${datePart}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
}

// ? Truncates to HH:MM — picker only supports hours and minutes
function parseTimeFromDisplay(raw: string): string | null {
    if (!DISPLAY_PATTERN.test(raw)) return null;
    const timePart = raw.slice(11);
    const parts = timePart.split(':');
    const hour = Number.parseInt(parts[0] ?? '', 10);
    const minute = Number.parseInt(parts[1] ?? '', 10);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return `${DateHelper.padNumber(hour)}:${DateHelper.padNumber(minute)}`;
}

export const DateTimeInput = ({value, onChange, onBlur, config, enabled, errors}: DateTimeInputProps): ReactElement => {
    const [rawInput, setRawInput] = useState(() => valueToDisplay(value));
    const [open, setOpen] = useState(false);
    // ? DatePicker/TimePicker API uses null for "no selection"
    const [draftDate, setDraftDate] = useState<Date | null>(null);
    const [draftTime, setDraftTime] = useState<string | null>(null);
    const lastEmitted = useRef<string | undefined>(undefined);
    const inputRef = useRef<HTMLInputElement>(null);
    const inputWrapperRef = useRef<HTMLDivElement>(null);
    const t = useI18n();

    useEffect(() => {
        const parentDisplay = valueToDisplay(value);
        if (lastEmitted.current === parentDisplay) return;
        setRawInput(parentDisplay);
    }, [value]);

    const handleInputChange = (e: JSX.TargetedEvent<HTMLInputElement>) => {
        const inputValue = e.currentTarget.value;
        setRawInput(inputValue);
        if (inputValue === '') {
            lastEmitted.current = '';
            onChange(ValueTypes.LOCAL_DATE_TIME.newNullValue());
        } else {
            const storageValue = displayToStorage(inputValue);
            const newValue = ValueTypes.LOCAL_DATE_TIME.newValue(storageValue);
            lastEmitted.current = valueToDisplay(newValue);
            onChange(newValue, inputValue);
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
        const display = formatDisplay(draftDate, draftTime);
        const storageValue = displayToStorage(display);
        const newValue = ValueTypes.LOCAL_DATE_TIME.newValue(storageValue);
        setRawInput(display);
        lastEmitted.current = valueToDisplay(newValue);
        onChange(newValue);
        setOpen(false);
        inputRef.current?.focus();
    };

    const handleSetDefault = () => {
        if (config.default == null) return;
        setDraftDate(config.default);
        const hours = config.default.getHours();
        const minutes = config.default.getMinutes();
        setDraftTime(`${DateHelper.padNumber(hours)}:${DateHelper.padNumber(minutes)}`);
    };

    const selectedDate = parseDateFromDisplay(rawInput);
    const selectedTime = parseTimeFromDisplay(rawInput);

    return (
        <DatePicker.Root
            data-component={DATE_TIME_INPUT_NAME}
            value={open ? draftDate : selectedDate}
            onValueChange={handleDraftDateChange}
            closeOnSelect={false}
            open={open}
            onOpenChange={isOpen => {
                if (isOpen) {
                    setDraftDate(selectedDate);
                    if (selectedTime != null) {
                        setDraftTime(selectedTime);
                    } else {
                        const now = new Date();
                        setDraftTime(
                            `${DateHelper.padNumber(now.getHours())}:${DateHelper.padNumber(now.getMinutes())}`,
                        );
                    }
                }
                setOpen(isOpen);
            }}
            focusOnCloseRef={inputRef}
        >
            <div ref={inputWrapperRef}>
                <Input
                    ref={inputRef}
                    type='text'
                    placeholder='YYYY-MM-DD hh:mm'
                    value={rawInput}
                    onChange={handleInputChange}
                    onBlur={onBlur}
                    disabled={!enabled}
                    error={getFirstError(errors)}
                    endAddon={
                        <div className='flex h-full w-11 items-center justify-center bg-transparent'>
                            <DatePicker.Trigger disabled={!enabled} aria-label='Open date and time picker' />
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
