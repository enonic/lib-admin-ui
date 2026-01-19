import {Property} from '../../../data/Property';
import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {BaseInputTypeNotManagingAdd} from '../support/BaseInputTypeNotManagingAdd';
import {Element} from '../../../dom/Element';
import {DatePicker, DatePickerBuilder} from '../../../ui/time/DatePicker';
import {SelectedDateChangedEvent} from '../../../ui/time/SelectedDateChangedEvent';
import {LocalDate} from '../../../util/LocalDate';
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';
import {ValueTypeConverter} from '../../../data/ValueTypeConverter';
import {AdditionalValidationRecord} from '../../AdditionalValidationRecord';
import {i18n} from '../../../util/Messages';
import {RelativeTimeParser} from './RelativeTimeParser';

/**
 * Uses [[ValueType]] [[ValueTypeLocalDate]].
 */
export class DateType
    extends BaseInputTypeNotManagingAdd {

    private static readonly PATTERN = /^\d{4}-\d{2}-\d{2}$/;

    resolveDefaultValue(): Date {
        return this.getDefaultValue()?.getDateTime()?.toDate();
    }

    createDefaultValue(rawValue: unknown): Value {
        if (typeof rawValue !== 'string') {
            return this.getValueType().newNullValue();
        }

        if (DateType.PATTERN.test(rawValue)) {
            return this.getValueType().newValue(rawValue);
        } else {
            const value = LocalDate.fromDate(RelativeTimeParser.parseToDate(rawValue));
            return new Value(value, ValueTypes.LOCAL_DATE);
        }
    }

    getValueType(): ValueType {
        return ValueTypes.LOCAL_DATE;
    }

    createInputOccurrenceElement(_index: number, property: Property): Element {
        if (!this.getValueType().equals(property.getType())) {
            ValueTypeConverter.convertPropertyValueType(property, this.getValueType());
        }

        const datePickerBuilder: DatePickerBuilder = new DatePickerBuilder();

        if (!property.hasNullValue()) {
            const date: LocalDate = property.getLocalDate();
            datePickerBuilder.setDateTime(date.toDate());
        }

        const defaultDate: Date = this.resolveDefaultValue();
        if (defaultDate) {
            datePickerBuilder.setDefaultValue(defaultDate);
        }

        const datePicker: DatePicker = datePickerBuilder.build();

        datePicker.onSelectedDateTimeChanged((event: SelectedDateChangedEvent) => {
            this.handleOccurrenceInputValueChanged(datePicker, event);
        });

        return datePicker;
    }

    protected getValue(inputEl: Element, event: SelectedDateChangedEvent): Value {
        return new Value(event.getDate() != null ? LocalDate.fromDate(event.getDate()) : null, this.getValueType());
    }

    doValidateUserInput(inputEl: DatePicker) {
        super.doValidateUserInput(inputEl);

        if (!inputEl.isValid()) {
            const record: AdditionalValidationRecord =
                AdditionalValidationRecord.create().setMessage(i18n('field.value.invalid')).build();

            this.occurrenceValidationState.get(inputEl.getId()).addAdditionalValidation(record);
        }
    }

    updateInputOccurrenceElement(occurrence: Element, property: Property, unchangedOnly?: boolean) {
        const datePicker = occurrence as DatePicker;

        if (!unchangedOnly || !datePicker.isDirty()) {
            let date = property.hasNonNullValue() ? property.getLocalDate().toDate() : null;
            datePicker.setDateTime(date);
        } else if (datePicker.isDirty()) {
            datePicker.forceSelectedDateTimeChangedEvent();
        }
    }

    resetInputOccurrenceElement(occurrence: Element): void {
        super.resetInputOccurrenceElement(occurrence);

        let input = occurrence as DatePicker;

        input.resetBase();
    }

    clearInputOccurrenceElement(occurrence: Element): void {
        super.clearInputOccurrenceElement(occurrence);
        (occurrence as DatePicker).clear();
    }

    setEnabledInputOccurrenceElement(occurrence: Element, enable: boolean) {
        const input: DatePicker = occurrence as DatePicker;

        input.setEnabled(enable);
    }
}

InputTypeManager.register(new Class('Date', DateType), true);
