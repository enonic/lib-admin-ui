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

/**
 * Uses [[ValueType]] [[ValueTypeLocalDate]].
 */
export class DateType
    extends BaseInputTypeNotManagingAdd {

    getDefaultValue(): Date {
        return this.getContext().input.getDefaultValue()?.getDateTime()?.toDate();
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

        const defaultDate: Date = this.getDefaultValue();
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
        const datePicker = <DatePicker> occurrence;

        if (!unchangedOnly || !datePicker.isDirty()) {
            let date = property.hasNonNullValue() ? property.getLocalDate().toDate() : null;
            datePicker.setDateTime(date);
        } else if (datePicker.isDirty()) {
            datePicker.forceSelectedDateTimeChangedEvent();
        }
    }

    resetInputOccurrenceElement(occurrence: Element): void {
        super.resetInputOccurrenceElement(occurrence);

        let input = <DatePicker> occurrence;

        input.resetBase();
    }

    setEnabledInputOccurrenceElement(occurrence: Element, enable: boolean) {
        const input: DatePicker = <DatePicker> occurrence;

        input.setEnabled(enable);
    }
}

InputTypeManager.register(new Class('Date', DateType), true);
