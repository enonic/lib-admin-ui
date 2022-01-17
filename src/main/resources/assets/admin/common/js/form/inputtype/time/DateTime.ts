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
import {ValueTypeConverter} from '../../../data/ValueTypeConverter';
import {AdditionalValidationRecord} from '../../AdditionalValidationRecord';
import {i18n} from '../../../util/Messages';

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

    getDefaultDate(): Date {
        return this.getContext().input.getDefaultValue()?.getDateTime()?.toDate();
    }

    getValueType(): ValueType {
        return this.valueType;
    }

    createInputOccurrenceElement(_index: number, property: Property): Element {
        if (this.getValueType() === ValueTypes.DATE_TIME) {
            return this.createInputAsDateTime(property);
        }

        return this.createInputAsLocalDateTime(property);
    }

    updateInputOccurrenceElement(occurrence: Element, property: Property, unchangedOnly: boolean) {
        const dateTimePicker: DateTimePicker = <DateTimePicker> occurrence;

        if (!unchangedOnly || !dateTimePicker.isDirty()) {

            const date = property.hasNonNullValue()
                       ? this.getValueType() === ValueTypes.DATE_TIME
                         ? property.getDateTime().toDate()
                         : property.getLocalDateTime().toDate()
                       : null;
            dateTimePicker.setSelectedDateTime(date);
        } else if (dateTimePicker.isDirty()) {
            dateTimePicker.forceSelectedDateTimeChangedEvent();
        }
    }

    resetInputOccurrenceElement(occurrence: Element) {
        const input: DateTimePicker = <DateTimePicker> occurrence;

        input.resetBase();
    }

    setEnabledInputOccurrenceElement(occurrence: Element, enable: boolean) {
        const input: DateTimePicker = <DateTimePicker> occurrence;

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

    private readConfig(inputConfig: { [element: string]: { [name: string]: string }[]; }): void {
        const timeZoneConfig = inputConfig['timezone'] && inputConfig['timezone'][0];
        const timeZone = timeZoneConfig && timeZoneConfig['value'];

        if (timeZone === 'true') {
            this.valueType = ValueTypes.DATE_TIME;
        }
    }

    private createInputAsLocalDateTime(property: Property) {
        const dateTimeBuilder: DateTimePickerBuilder = new DateTimePickerBuilder();
        const defaultDate = this.getDefaultDate();
        if (defaultDate) {
            dateTimeBuilder.setDefaultValue(defaultDate);
        }

        if (!ValueTypes.LOCAL_DATE_TIME.equals(property.getType())) {
            ValueTypeConverter.convertPropertyValueType(property, ValueTypes.LOCAL_DATE_TIME);
        }

        if (property.hasNonNullValue()) {
            const date: LocalDateTime = property.getLocalDateTime();
            dateTimeBuilder.setDate(date.toDate());
        }

        const dateTimePicker: DateTimePicker = dateTimeBuilder.build();

        dateTimePicker.onSelectedDateTimeChanged((event: SelectedDateChangedEvent) => {
            this.handleOccurrenceInputValueChanged(dateTimePicker, event);
        });

        return dateTimePicker;
    }

    protected getValue(inputEl: Element, event: SelectedDateChangedEvent): Value {
        return new Value(event.getDate() != null ? this.getValueType() === ValueTypes.LOCAL_DATE_TIME
                                                   ? LocalDateTime.fromDate(event.getDate())
                                                   : DateTimeUtil.fromDate(event.getDate()) : null, this.getValueType());
    }

    private createInputAsDateTime(property: Property) {
        const dateTimeBuilder: DateTimePickerBuilder = new DateTimePickerBuilder();
        dateTimeBuilder.setUseLocalTimezoneIfNotPresent(true);
        dateTimeBuilder.setDefaultValue(this.getDefaultDate());

        if (!ValueTypes.DATE_TIME.equals(property.getType())) {
            ValueTypeConverter.convertPropertyValueType(property, ValueTypes.DATE_TIME);
        }

        if (property.hasNonNullValue()) {
            const date: DateTimeUtil = property.getDateTime();
            dateTimeBuilder.setDate(date.toDate()).setTimezone(date.getTimezone());
        }

        const dateTimePicker: DateTimePicker = dateTimeBuilder.build();

        dateTimePicker.onSelectedDateTimeChanged((event: SelectedDateChangedEvent) => {
            this.handleOccurrenceInputValueChanged(dateTimePicker, event);
        });

        return dateTimePicker;
    }
}

InputTypeManager.register(new Class('DateTime', DateTime), true);
