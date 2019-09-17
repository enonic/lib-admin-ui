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

/**
 * Uses [[ValueType]] [[ValueTypeLocalDate]].
 */
export class Date
    extends BaseInputTypeNotManagingAdd {

    getValueType(): ValueType {
        return ValueTypes.LOCAL_DATE;
    }

    newInitialValue(): Value {
        return super.newInitialValue() || ValueTypes.LOCAL_DATE.newNullValue();
    }

    createInputOccurrenceElement(_index: number, property: Property): Element {
        if (!ValueTypes.LOCAL_DATE.equals(property.getType())) {
            ValueTypeConverter.convertPropertyValueType(property, ValueTypes.LOCAL_DATE);
        }

        let datePickerBuilder = new DatePickerBuilder();

        if (!property.hasNullValue()) {
            let date = property.getLocalDate();
            datePickerBuilder.setDate(date.toDate());
        }
        let datePicker = datePickerBuilder.build();

        datePicker.onSelectedDateTimeChanged((event: SelectedDateChangedEvent) => {
            let value = new Value(event.getDate() != null ? LocalDate.fromDate(event.getDate()) : null,
                ValueTypes.LOCAL_DATE);
            this.notifyOccurrenceValueChanged(datePicker, value);
        });

        return datePicker;
    }

    updateInputOccurrenceElement(occurrence: Element, property: Property, unchangedOnly?: boolean) {
        const datePicker = <DatePicker> occurrence;

        if (!unchangedOnly || !datePicker.isDirty()) {
            let date = property.hasNonNullValue() ? property.getLocalDate().toDate() : null;
            datePicker.setSelectedDate(date);
        } else if (datePicker.isDirty()) {
            datePicker.forceSelectedDateTimeChangedEvent();
        }
    }

    resetInputOccurrenceElement(occurrence: Element) {
        let input = <DatePicker> occurrence;

        input.resetBase();
    }

    valueBreaksRequiredContract(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.LOCAL_DATE);
    }

    hasInputElementValidUserInput(inputElement: Element) {
        let datePicker = <DatePicker>inputElement;
        return datePicker.isValid();
    }
}

InputTypeManager.register(new Class('Date', Date));
