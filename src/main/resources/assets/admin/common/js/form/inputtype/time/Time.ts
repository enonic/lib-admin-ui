import {Property} from '../../../data/Property';
import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {BaseInputTypeNotManagingAdd} from '../support/BaseInputTypeNotManagingAdd';
import {Element} from '../../../dom/Element';
import {TimePicker, TimePickerBuilder} from '../../../ui/time/TimePicker';
import {SelectedDateChangedEvent} from '../../../ui/time/SelectedDateChangedEvent';
import {LocalTime} from '../../../util/LocalTime';
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';

/**
 * Uses [[ValueType]] [[ValueTypeLocalTime]].
 */
export class Time
    extends BaseInputTypeNotManagingAdd {

    getValueType(): ValueType {
        return ValueTypes.LOCAL_TIME;
    }

    newInitialValue(): Value {
        return super.newInitialValue() || ValueTypes.LOCAL_TIME.newNullValue();
    }

    createInputOccurrenceElement(_index: number, property: Property): Element {
        if (!ValueTypes.LOCAL_TIME.equals(property.getType())) {
            property.convertValueType(ValueTypes.LOCAL_TIME);
        }

        const value = this.getValueFromProperty(property);
        const timePicker: TimePicker = new TimePickerBuilder().setHours(value.hours).setMinutes(value.minutes).build();

        timePicker.onSelectedDateTimeChanged((event: SelectedDateChangedEvent) => {

            let newValue = new Value(event.getDate() != null ? LocalTime.fromDate(event.getDate()) : null,
                ValueTypes.LOCAL_TIME);

            this.notifyOccurrenceValueChanged(timePicker, newValue);
        });

        return timePicker;
    }

    updateInputOccurrenceElement(occurrence: Element, property: Property, unchangedOnly: boolean) {
        const localTime = <TimePicker> occurrence;

        if (!unchangedOnly || !localTime.isDirty() || !localTime.isValid()) {

            let value = this.getValueFromProperty(property);
            localTime.setSelectedTime(value.hours, value.minutes);
        } else if (localTime.isDirty()) {
            localTime.forceSelectedDateTimeChangedEvent();
        }
    }

    resetInputOccurrenceElement(occurrence: Element) {
        let input = <TimePicker> occurrence;

        input.resetBase();
    }

    availableSizeChanged() {
        // must be implemented by children
    }

    valueBreaksRequiredContract(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.LOCAL_TIME);
    }

    hasInputElementValidUserInput(inputElement: Element) {
        let timePicker = <TimePicker> inputElement;
        return timePicker.isValid();
    }

    private getValueFromProperty(property: Property): { hours: number; minutes: number } {
        let hours = -1;
        let minutes = -1;
        if (property && property.hasNonNullValue()) {
            let localTime: LocalTime = property.getLocalTime();
            if (localTime) {
                let adjustedTime = localTime.getAdjustedTime();
                hours = adjustedTime.hour;
                minutes = adjustedTime.minute;
            }
        }
        return {
            hours: hours,
            minutes: minutes
        };
    }

}

InputTypeManager.register(new Class('Time', Time));
