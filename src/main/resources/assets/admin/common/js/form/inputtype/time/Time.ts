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
import {ValueTypeConverter} from '../../../data/ValueTypeConverter';
import {AdditionalValidationRecord} from '../../AdditionalValidationRecord';
import {i18n} from '../../../util/Messages';
import {TimeHMS} from '../../../util/TimeHMS';
import {TimeHM} from '../../../util/TimeHM';

/**
 * Uses [[ValueType]] [[ValueTypeLocalTime]].
 */
export class Time
    extends BaseInputTypeNotManagingAdd {

    getDefaultValue(): Date {
        const defaultTime: LocalTime = this.getContext().input.getDefaultValue()?.getLocalTime();
        if (!defaultTime) {
            return null;
        }
        const result: Date = new Date();
        result.setHours(defaultTime.getHours());
        result.setMinutes(defaultTime.getMinutes());

        return result;
    }

    getValueType(): ValueType {
        return ValueTypes.LOCAL_TIME;
    }

    createInputOccurrenceElement(_index: number, property: Property): Element {
        if (!this.getValueType().equals(property.getType())) {
            ValueTypeConverter.convertPropertyValueType(property, this.getValueType());
        }

        const timePickerBuilder: TimePickerBuilder = new TimePickerBuilder();
        if (!property.hasNullValue()) {
            const value: TimeHM = this.getValueFromProperty(property);
            timePickerBuilder.setHours(value.hours).setMinutes(value.minutes);
        }

        const defaultDate: Date = this.getDefaultValue();
        if (defaultDate) {
            timePickerBuilder.setDefaultValue(defaultDate);
        }

        const timePicker: TimePicker = timePickerBuilder.build();

        timePicker.onSelectedDateTimeChanged((event: SelectedDateChangedEvent) => {
            this.handleOccurrenceInputValueChanged(timePicker, event);
        });

        return timePicker;
    }

    protected getValue(inputEl: Element, event: SelectedDateChangedEvent): Value {
        return new Value(event.getDate() != null ? LocalTime.fromDate(event.getDate()) : null, this.getValueType());
    }

    updateInputOccurrenceElement(occurrence: Element, property: Property, unchangedOnly: boolean): void {
        const localTime: TimePicker = <TimePicker> occurrence;

        if (!unchangedOnly || !localTime.isDirty() || !localTime.isValid()) {
            if (!property.hasNullValue()) {
                const value: TimeHM = this.getValueFromProperty(property);
                localTime.setTime(value);
            }
        } else if (localTime.isDirty()) {
            localTime.forceSelectedDateTimeChangedEvent();
        }
    }

    resetInputOccurrenceElement(occurrence: Element) {
        const input: TimePicker = <TimePicker> occurrence;

        input.resetBase();
    }

    setEnabledInputOccurrenceElement(occurrence: Element, enable: boolean) {
        const input: TimePicker = <TimePicker> occurrence;

        input.setEnabled(enable);
    }

    doValidateUserInput(inputEl: TimePicker) {
        super.doValidateUserInput(inputEl);

        if (!inputEl.isValid()) {
            const record: AdditionalValidationRecord =
                AdditionalValidationRecord.create().setMessage(i18n('field.value.invalid')).build();

            this.occurrenceValidationState.get(inputEl.getId()).addAdditionalValidation(record);
        }
    }

    private getValueFromProperty(property: Property): TimeHM {
        let hours: number;
        let minutes: number;

        if (property && property.hasNonNullValue()) {
            const localTime: LocalTime = property.getLocalTime();

            if (localTime) {
                const adjustedTime: TimeHMS = localTime.getAdjustedTime();
                hours = adjustedTime.hours;
                minutes = adjustedTime.minutes;
            }
        }

        return new TimeHM(hours, minutes);
    }

}

InputTypeManager.register(new Class('Time', Time), true);
