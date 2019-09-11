import {Property} from '../../../data/Property';
import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {DateTimePicker, DateTimePickerBuilder} from '../../../ui/time/DateTimePicker';
import {BaseInputTypeNotManagingAdd} from '../support/BaseInputTypeNotManagingAdd';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {Element} from '../../../dom/Element';
import {SelectedDateChangedEvent} from '../../../ui/time/SelectedDateChangedEvent';
import {LocalDateTime} from '../../../util/LocalDateTime';
import {InputTypeName} from '../../InputTypeName';
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';
import {DateTime as DateTimeUtil} from '../../../util/DateTime';

/**
 * Uses [[ValueType]] [[ValueTypeLocalDateTime]].
 */
export class DateTime
    extends BaseInputTypeNotManagingAdd {

    private valueType: ValueType = ValueTypes.LOCAL_DATE_TIME;

    constructor(config: InputTypeViewContext) {
        super(config);
        this.readConfig(config.inputConfig);
    }

    static getName(): InputTypeName {
        return new InputTypeName('DateTime', false);
    }

    getValueType(): ValueType {
        return this.valueType;
    }

    newInitialValue(): Value {
        return super.newInitialValue() || this.valueType.newNullValue();
    }

    createInputOccurrenceElement(_index: number, property: Property): Element {
        if (this.valueType === ValueTypes.DATE_TIME) {
            return this.createInputAsDateTime(property);
        }

        return this.createInputAsLocalDateTime(property);
    }

    updateInputOccurrenceElement(occurrence: Element, property: Property, unchangedOnly: boolean) {
        const dateTimePicker = <DateTimePicker> occurrence;

        if (!unchangedOnly || !dateTimePicker.isDirty()) {

            let date = property.hasNonNullValue()
                       ? this.valueType === ValueTypes.DATE_TIME
                         ? property.getDateTime().toDate()
                         : property.getLocalDateTime().toDate()
                       : null;
            dateTimePicker.setSelectedDateTime(date);
        } else if (dateTimePicker.isDirty()) {
            dateTimePicker.forceSelectedDateTimeChangedEvent();
        }
    }

    resetInputOccurrenceElement(occurrence: Element) {
        let input = <DateTimePicker> occurrence;

        input.resetBase();
    }

    hasInputElementValidUserInput(inputElement: Element) {
        let dateTimePicker = <DateTimePicker>inputElement;
        return dateTimePicker.isValid();
    }

    availableSizeChanged() {
        // Nothing
    }

    valueBreaksRequiredContract(value: Value): boolean {
        return value.isNull() || !(value.getType().equals(ValueTypes.LOCAL_DATE_TIME) || value.getType().equals(ValueTypes.DATE_TIME));
    }

    private readConfig(inputConfig: { [element: string]: { [name: string]: string }[]; }): void {
        let timeZoneConfig = inputConfig['timezone'] && inputConfig['timezone'][0];
        let timeZone = timeZoneConfig && timeZoneConfig['value'];

        if (timeZone === 'true') {
            this.valueType = ValueTypes.DATE_TIME;
        }
    }

    private createInputAsLocalDateTime(property: Property) {
        let dateTimeBuilder = new DateTimePickerBuilder();

        if (!ValueTypes.LOCAL_DATE_TIME.equals(property.getType())) {
            property.convertValueType(ValueTypes.LOCAL_DATE_TIME);
        }

        if (property.hasNonNullValue()) {
            let date = property.getLocalDateTime();
            dateTimeBuilder.setDate(date.toDate());
        }

        let dateTimePicker = dateTimeBuilder.build();

        dateTimePicker.onSelectedDateTimeChanged((event: SelectedDateChangedEvent) => {
            let value = new Value(event.getDate() != null ? LocalDateTime.fromDate(event.getDate()) : null,
                ValueTypes.LOCAL_DATE_TIME);
            this.notifyOccurrenceValueChanged(dateTimePicker, value);
        });

        return dateTimePicker;
    }

    private createInputAsDateTime(property: Property) {
        let dateTimeBuilder = new DateTimePickerBuilder();
        dateTimeBuilder.setUseLocalTimezoneIfNotPresent(true);

        if (!ValueTypes.DATE_TIME.equals(property.getType())) {
            property.convertValueType(ValueTypes.DATE_TIME);
        }

        if (property.hasNonNullValue()) {
            let date: DateTimeUtil = property.getDateTime();
            dateTimeBuilder.setDate(date.toDate()).setTimezone(date.getTimezone());
        }

        let dateTimePicker = new DateTimePicker(dateTimeBuilder);
        dateTimePicker.onSelectedDateTimeChanged((event: SelectedDateChangedEvent) => {
            let value = new Value(event.getDate() != null ? DateTimeUtil.fromDate(event.getDate()) : null,
                ValueTypes.DATE_TIME);
            this.notifyOccurrenceValueChanged(dateTimePicker, value);
        });
        return dateTimePicker;
    }
}

InputTypeManager.register(new Class('DateTime', DateTime));
