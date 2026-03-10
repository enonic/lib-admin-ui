import {Button, DatePicker, Input} from '@enonic/ui';
import {type JSX, type ReactElement, useEffect, useRef, useState} from 'react';

import {ValueTypes} from '../../../data/ValueTypes';
import {DateHelper} from '../../../util/DateHelper';
import type {DateConfig} from '../../descriptor/InputTypeConfig';
import {useI18n} from '../../I18nContext';
import type {InputTypeComponentProps} from '../../types';
import {getFirstError} from '../../utils/validation';

const DATE_INPUT_NAME = 'DateInput';

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type DateInputProps = InputTypeComponentProps<DateConfig>;

function valueToString(value: DateInputProps['value']): string {
    return value.isNull() ? '' : (value.getString() ?? '');
}

export const DateInput = ({value, onChange, onBlur, config, enabled, errors}: DateInputProps): ReactElement => {
    const [rawInput, setRawInput] = useState(() => valueToString(value));
    const [open, setOpen] = useState(false);
    // ? DatePicker API uses null for "no selection" — applies to draftDate, selectedDate, calendarValue
    const [draftDate, setDraftDate] = useState<Date | null>(null);
    const lastEmitted = useRef<string | undefined>(undefined);
    const inputRef = useRef<HTMLInputElement>(null);
    const inputWrapperRef = useRef<HTMLDivElement>(null);
    const t = useI18n();

    // Sync from parent only on external value changes (e.g. form reset).
    // Skip when the string representation matches what we last emitted.
    useEffect(() => {
        const parentStr = valueToString(value);
        if (lastEmitted.current === parentStr) return;
        setRawInput(parentStr);
    }, [value]);

    const handleInputChange = (e: JSX.TargetedEvent<HTMLInputElement>) => {
        const inputValue = e.currentTarget.value;
        setRawInput(inputValue);
        if (inputValue === '') {
            lastEmitted.current = '';
            onChange(ValueTypes.LOCAL_DATE.newNullValue());
        } else {
            const newValue = ValueTypes.LOCAL_DATE.newValue(inputValue);
            lastEmitted.current = valueToString(newValue);
            onChange(newValue, inputValue);
        }
    };

    const handleDraftChange = (date: Date | null) => {
        setDraftDate(date);
    };

    const handleConfirm = () => {
        if (draftDate == null) return;
        const formatted = DateHelper.formatDate(draftDate);
        setRawInput(formatted);
        lastEmitted.current = formatted;
        onChange(ValueTypes.LOCAL_DATE.newValue(formatted));
        setOpen(false);
    };

    const handleSetDefault = () => {
        if (config.default == null) return;
        setDraftDate(config.default);
    };

    const selectedDate = DATE_PATTERN.test(rawInput) ? new Date(`${rawInput}T00:00:00`) : null;
    const calendarValue = open ? draftDate : selectedDate;

    return (
        <DatePicker.Root
            // ? @enonic/ui composables forward data attrs to the DOM root
            data-component={DATE_INPUT_NAME}
            value={calendarValue}
            onValueChange={handleDraftChange}
            closeOnSelect={false}
            open={open}
            onOpenChange={isOpen => {
                if (isOpen) {
                    setDraftDate(selectedDate);
                }
                setOpen(isOpen);
            }}
            focusOnCloseRef={inputRef}
        >
            <div ref={inputWrapperRef}>
                <Input
                    ref={inputRef}
                    type='text'
                    placeholder='YYYY-MM-DD'
                    value={rawInput}
                    onChange={handleInputChange}
                    onBlur={onBlur}
                    disabled={!enabled}
                    error={getFirstError(errors)}
                    endAddon={
                        <div className='flex h-full w-11 items-center justify-center bg-transparent'>
                            <DatePicker.Trigger disabled={!enabled} aria-label='Open calendar' />
                        </div>
                    }
                />
            </div>
            <DatePicker.Portal>
                <DatePicker.Content anchorRef={inputWrapperRef} align='end'>
                    <DatePicker.Header />
                    <DatePicker.Weekdays />
                    <DatePicker.Grid />
                    <div className='border-bdr-soft border-t pt-3'>
                        <div className='flex items-center gap-3'>
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
                </DatePicker.Content>
            </DatePicker.Portal>
        </DatePicker.Root>
    );
};

DateInput.displayName = DATE_INPUT_NAME;
