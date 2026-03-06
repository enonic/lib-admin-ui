import {Button, Input, TimePicker} from '@enonic/ui';
import type {ReactElement} from 'react';
import {useEffect, useRef, useState} from 'react';

import {ValueTypes} from '../../../data/ValueTypes';
import {DateHelper} from '../../../util/DateHelper';
import {i18n} from '../../../util/Messages';
import type {TimeConfig} from '../../descriptor/InputTypeConfig';
import type {InputTypeComponentProps} from '../../types';
import {getFirstError} from '../../utils/validation';

const TIME_INPUT_NAME = 'TimeInput';

const TIME_PATTERN = /^\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

export type TimeInputProps = InputTypeComponentProps<TimeConfig>;

function valueToString(value: TimeInputProps['value']): string {
    return value.isNull() ? '' : (value.getString() ?? '');
}

function formatTimeFromDate(date: Date): string {
    return DateHelper.formatTime(date.getHours(), date.getMinutes());
}

function parseTimeToPickerValue(raw: string): string | null {
    if (!raw) return null;
    const parts = raw.split(':');
    const hour = Number.parseInt(parts[0] ?? '', 10);
    const minute = Number.parseInt(parts[1] ?? '', 10);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return `${DateHelper.padNumber(hour)}:${DateHelper.padNumber(minute)}`;
}

export const TimeInput = ({value, onChange, onBlur, config, enabled, errors}: TimeInputProps): ReactElement => {
    const [rawInput, setRawInput] = useState(() => valueToString(value));
    const [open, setOpen] = useState(false);
    const [draftTime, setDraftTime] = useState<string | null>(null);
    const lastEmitted = useRef<string | undefined>(undefined);
    const inputRef = useRef<HTMLInputElement>(null);
    const inputWrapperRef = useRef<HTMLDivElement>(null);
    const setDefaultLabel = i18n('action.setDefault');
    const okLabel = i18n('action.ok');

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
            onChange(ValueTypes.LOCAL_TIME.newNullValue());
        } else {
            const newValue = ValueTypes.LOCAL_TIME.newValue(inputValue);
            lastEmitted.current = valueToString(newValue);
            onChange(newValue, inputValue);
        }
    };

    const handleDraftChange = (nextValue: string | null) => {
        setDraftTime(nextValue);
    };

    const handleConfirm = () => {
        if (draftTime == null) return;
        setRawInput(draftTime);
        lastEmitted.current = draftTime;
        onChange(ValueTypes.LOCAL_TIME.newValue(draftTime));
        setOpen(false);
        inputRef.current?.focus();
    };

    const handleSetDefault = () => {
        if (config.default == null) return;
        setDraftTime(formatTimeFromDate(config.default));
    };

    const pickerValue = TIME_PATTERN.test(rawInput) ? parseTimeToPickerValue(rawInput) : null;

    return (
        <TimePicker
            data-component={TIME_INPUT_NAME}
            value={open ? draftTime : pickerValue}
            onValueChange={handleDraftChange}
            open={open}
            onOpenChange={isOpen => {
                if (isOpen) {
                    setDraftTime(pickerValue);
                }
                setOpen(isOpen);
            }}
        >
            <div ref={inputWrapperRef}>
                <Input
                    ref={inputRef}
                    type='text'
                    placeholder='HH:MM'
                    value={rawInput}
                    onChange={handleInputChange}
                    onBlur={onBlur}
                    disabled={!enabled}
                    error={getFirstError(errors)}
                    endAddon={
                        <div className='flex h-full w-11 items-center justify-center bg-transparent'>
                            <TimePicker.Trigger
                                className='size-8 bg-transparent'
                                disabled={!enabled}
                                aria-label='Open time picker'
                            />
                        </div>
                    }
                />
            </div>
            <TimePicker.Content className='z-1 flex-col' anchorRef={inputWrapperRef} align='end'>
                <div className='flex items-center gap-2'>
                    <TimePicker.HourSelect className='w-20' />
                    <span className='font-bold text-lg text-main'>:</span>
                    <TimePicker.MinuteSelect className='w-20' />
                </div>
                <div className='w-full border-bdr-soft border-t pt-3'>
                    <div className='flex items-center gap-3'>
                        {config.default != null && (
                            <Button variant='solid' size='sm' onClick={handleSetDefault}>
                                {setDefaultLabel}
                            </Button>
                        )}
                        <Button
                            className='ml-auto'
                            variant='solid'
                            size='sm'
                            onClick={handleConfirm}
                            disabled={draftTime == null}
                        >
                            {okLabel}
                        </Button>
                    </div>
                </div>
            </TimePicker.Content>
        </TimePicker>
    );
};

TimeInput.displayName = TIME_INPUT_NAME;
