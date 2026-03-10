import {Button, DatePicker, Input, TimePicker} from '@enonic/ui';
import type {ReactElement} from 'react';
import {useEffect, useRef, useState} from 'react';

import {ValueTypes} from '../../../data/ValueTypes';
import {DateHelper} from '../../../util/DateHelper';
import {DATETIME_PATTERN} from '../../descriptor/DateTimeDescriptor';
import type {DateTimeConfig} from '../../descriptor/InputTypeConfig';
import {useI18n} from '../../I18nContext';
import type {InputTypeComponentProps} from '../../types';
import {getFirstError} from '../../utils/validation';

const DATE_TIME_INPUT_NAME = 'DateTimeInput';

export type DateTimeInputProps = InputTypeComponentProps<DateTimeConfig>;

function valueToString(value: DateTimeInputProps['value']): string {
    return value.isNull() ? '' : (value.getString() ?? '');
}

function formatDateTime(date: Date, time: string | null): string {
    const datePart = DateHelper.formatDate(date);
    const timePart = time ?? `${DateHelper.padNumber(date.getHours())}:${DateHelper.padNumber(date.getMinutes())}`;
    return `${datePart}T${timePart}`;
}

function parseDateFromDateTime(raw: string): Date | null {
    if (!DATETIME_PATTERN.test(raw)) return null;
    const datePart = raw.slice(0, 10);
    const parsed = new Date(`${datePart}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
}

// ? Truncates to HH:MM — picker only supports hours and minutes
function parseTimeFromDateTime(raw: string): string | null {
    if (!DATETIME_PATTERN.test(raw)) return null;
    const timePart = raw.slice(11);
    const parts = timePart.split(':');
    const hour = Number.parseInt(parts[0] ?? '', 10);
    const minute = Number.parseInt(parts[1] ?? '', 10);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return `${DateHelper.padNumber(hour)}:${DateHelper.padNumber(minute)}`;
}

export const DateTimeInput = ({value, onChange, onBlur, config, enabled, errors}: DateTimeInputProps): ReactElement => {
    const [rawInput, setRawInput] = useState(() => valueToString(value));
    const [open, setOpen] = useState(false);
    // ? DatePicker/TimePicker API uses null for "no selection"
    const [draftDate, setDraftDate] = useState<Date | null>(null);
    const [draftTime, setDraftTime] = useState<string | null>(null);
    const lastEmitted = useRef<string | undefined>(undefined);
    const inputRef = useRef<HTMLInputElement>(null);
    const inputWrapperRef = useRef<HTMLDivElement>(null);
    const t = useI18n();

    useEffect(() => {
        const parentStr = valueToString(value);
        if (lastEmitted.current === parentStr) return;
        setRawInput(parentStr);
    }, [value]);

    const handleInputChange = (e: Event) => {
        const inputValue = (e.currentTarget as HTMLInputElement).value;
        setRawInput(inputValue);
        if (inputValue === '') {
            lastEmitted.current = '';
            onChange(ValueTypes.LOCAL_DATE_TIME.newNullValue());
        } else {
            const newValue = ValueTypes.LOCAL_DATE_TIME.newValue(inputValue);
            lastEmitted.current = valueToString(newValue);
            onChange(newValue, inputValue);
        }
    };

    const handleConfirm = () => {
        if (draftDate == null) return;
        const formatted = formatDateTime(draftDate, draftTime);
        const newValue = ValueTypes.LOCAL_DATE_TIME.newValue(formatted);
        setRawInput(formatted);
        lastEmitted.current = valueToString(newValue);
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

    const selectedDate = parseDateFromDateTime(rawInput);
    const selectedTime = parseTimeFromDateTime(rawInput);

    return (
        <DatePicker.Root
            data-component={DATE_TIME_INPUT_NAME}
            value={open ? draftDate : selectedDate}
            onValueChange={setDraftDate}
            closeOnSelect={false}
            open={open}
            onOpenChange={isOpen => {
                if (isOpen) {
                    setDraftDate(selectedDate);
                    setDraftTime(selectedTime);
                }
                setOpen(isOpen);
            }}
            focusOnCloseRef={inputRef}
        >
            <div ref={inputWrapperRef}>
                <Input
                    ref={inputRef}
                    type='text'
                    placeholder='YYYY-MM-DDThh:mm'
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
                            <div className='flex items-center justify-between gap-3'>
                                <TimePicker value={draftTime} onValueChange={setDraftTime}>
                                    <div className='flex items-center gap-2'>
                                        <TimePicker.HourSelect className='w-20' />
                                        <span className='font-bold text-lg text-main'>:</span>
                                        <TimePicker.MinuteSelect className='w-20' />
                                    </div>
                                </TimePicker>
                                <Button variant='solid' size='sm' onClick={handleConfirm} disabled={draftDate == null}>
                                    {t('action.ok')}
                                </Button>
                            </div>
                            {config.default != null && (
                                <div className='mt-3'>
                                    <Button variant='solid' size='sm' onClick={handleSetDefault}>
                                        {t('action.setDefault')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </DatePicker.Content>
            </DatePicker.Portal>
        </DatePicker.Root>
    );
};

DateTimeInput.displayName = DATE_TIME_INPUT_NAME;
