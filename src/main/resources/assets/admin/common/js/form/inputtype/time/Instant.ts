import {Property} from '../../../data/Property';
import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {DateTimePicker, DateTimePickerBuilder} from '../../../ui/time/DateTimePicker';
import {BaseInputTypeNotManagingAdd} from '../support/BaseInputTypeNotManagingAdd';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {Element} from '../../../dom/Element';
import {SelectedDateChangedEvent} from '../../../ui/time/SelectedDateChangedEvent';
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';
import {Instant as InstantUtil} from '../../../util/Instant';
import {ValueTypeConverter} from '../../../data/ValueTypeConverter';
import {AdditionalValidationRecord} from '../../AdditionalValidationRecord';
import {i18n} from '../../../util/Messages';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {Timezone} from '../../../util/Timezone';
import {ValueTypeInstant} from '../../../data/ValueTypeInstant';

dayjs.extend(utc);

/**
 * Uses [[ValueType]] [[ValueTypeInstant]].
 */
export class Instant
    extends BaseInputTypeNotManagingAdd {

    private valueType: ValueType = ValueTypes.INSTANT;

    constructor(config: InputTypeViewContext) {
        super(config);
        this.readConfig(config.inputConfig);
    }

    getDefaultValue(): Date {
        const inputConfig = this.getContext().inputConfig;
        const defaultValueConfig = inputConfig['default'] && inputConfig['default'][0];
        const defaultValue = defaultValueConfig && defaultValueConfig['value'] as string;

        if (!defaultValue) {
            return null;
        }

        const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
        if (isoRegex.test(defaultValue)) {
            return InstantUtil.fromString(defaultValue).toDate();
        } else {
            return this.parseRelative(defaultValue);
        }
    }

    getValueType(): ValueType {
        return this.valueType;
    }

    createInputOccurrenceElement(_index: number, property: Property): Element {
        const valueType: ValueType = this.getValueType();

        const dateTimeBuilder: DateTimePickerBuilder = new DateTimePickerBuilder();
        dateTimeBuilder.setUseLocalTimezone(true);

        const defaultDate: Date = this.getDefaultValue();
        if (defaultDate) {
            dateTimeBuilder.setDefaultValue(defaultDate);
        }

        if (!valueType.equals(property.getType())) {
            ValueTypeConverter.convertPropertyValueType(property, valueType);
        }

        if (property.hasNonNullValue()) {
            dateTimeBuilder.setDateTime(property.getInstant().toDate());
        } else if (defaultDate) {
            dateTimeBuilder.setDateTime(defaultDate);
        }

        const dateTimePicker: DateTimePicker = dateTimeBuilder.build();

        dateTimePicker.onSelectedDateTimeChanged((event: SelectedDateChangedEvent) =>
            this.handleOccurrenceInputValueChanged(dateTimePicker, event)
        );

        return dateTimePicker;
    }

    updateInputOccurrenceElement(occurrence: Element, property: Property, unchangedOnly: boolean) {
        const dateTimePicker: DateTimePicker = occurrence as DateTimePicker;

        if (!unchangedOnly || !dateTimePicker.isDirty()) {

            const date = property.hasNonNullValue()
                         ? property.getInstant().toDate()
                         : null;
            dateTimePicker.setDateTime(date);
        } else if (dateTimePicker.isDirty()) {
            dateTimePicker.forceSelectedDateTimeChangedEvent();
        }
    }

    resetInputOccurrenceElement(occurrence: Element): void {
        super.resetInputOccurrenceElement(occurrence);

        const input: DateTimePicker = occurrence as DateTimePicker;
        input.resetBase();
    }

    clearInputOccurrenceElement(occurrence: Element): void {
        super.clearInputOccurrenceElement(occurrence);
        (occurrence as DateTimePicker).clear();
    }

    setEnabledInputOccurrenceElement(occurrence: Element, enable: boolean) {
        const input: DateTimePicker = occurrence as DateTimePicker;

        input.setEnabled(enable);
    }

    doValidateUserInput(inputEl: DateTimePicker) {
        super.doValidateUserInput(inputEl);

        if (!inputEl.isValid()) {
            const record: AdditionalValidationRecord =
                AdditionalValidationRecord.create().setMessage(i18n('field.value.invalid')).build();

            this.occurrenceValidationState.get(inputEl.getId()).addAdditionalValidation(record);
        }
    }

    private readConfig(inputConfig: Record<string, Record<string, unknown>[]>): void {
        // do nothing
    }

    protected getValue(inputEl: Element, event: SelectedDateChangedEvent): Value {
        if (event.getDate() != null) {
            const timezone = Timezone.getDateTimezone(event.getDate());
            const timezoneOffset = timezone.getOffset();
            let date: Date = null;
            if (timezoneOffset > 0) {
                date = dayjs(event.getDate()).subtract(timezoneOffset, 'hours').toDate();
            }
            if (timezoneOffset < 0) {
                date = dayjs(event.getDate()).add(timezoneOffset, 'hours').toDate();
            }

            return new Value(InstantUtil.fromDate(date), this.getValueType());
        } else {
            return new Value(null, this.getValueType());
        }
    }

    private parseRelative(expr: any): Date {
        const base = dayjs();
        if (!expr || expr.trim() === 'now') {
            return InstantUtil.fromString(base.toISOString()).toDate();
        }

        const result = expr.trim().split(/\s+/).reduce((date, token) => {
            const match = token.match(/^([+-])(\d+)([a-zA-Z]+)$/);
            if (!match) {
                return date;
            }

            const [, sign, value, unit] = match;

            return sign === '+'
                   ? date.add(Number(value), unit)
                   : date.subtract(Number(value), unit);
        }, base);

        return InstantUtil.fromString(result.toISOString()).toDate();
    }
}

InputTypeManager.register(new Class('Instant', Instant), true);
