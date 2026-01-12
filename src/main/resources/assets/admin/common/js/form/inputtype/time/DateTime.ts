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
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';
import {ValueTypeConverter} from '../../../data/ValueTypeConverter';
import {AdditionalValidationRecord} from '../../AdditionalValidationRecord';
import {i18n} from '../../../util/Messages';
import {DateTime as DateTimeUtil} from '../../../util/DateTime';
import {RelativeTimeParser} from './RelativeTimeParser';

/**
 * Uses [[ValueType]] [[ValueTypeLocalDateTime]].
 */
export class DateTime
    extends BaseInputTypeNotManagingAdd {

    private static readonly PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

    private valueType: ValueType = ValueTypes.LOCAL_DATE_TIME;

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

        if (DateTime.PATTERN.test(defaultValue)) {
            return DateTimeUtil.fromString(defaultValue).toDate();
        } else {
            return RelativeTimeParser.parseToDateTime(defaultValue);
        }
    }

    getValueType(): ValueType {
        return this.valueType;
    }

    createInputOccurrenceElement(_index: number, property: Property): Element {
        const valueType: ValueType = this.getValueType();

        const dateTimeBuilder: DateTimePickerBuilder = new DateTimePickerBuilder();
        dateTimeBuilder.setUseLocalTimezone(false);

        const defaultDate: Date = this.getDefaultValue();
        if (defaultDate) {
            dateTimeBuilder.setDefaultValue(defaultDate);
        }

        if (!valueType.equals(property.getType())) {
            ValueTypeConverter.convertPropertyValueType(property, valueType);
        }

        if (property.hasNonNullValue()) {
            const date: LocalDateTime = property.getLocalDateTime();
            dateTimeBuilder.setDateTime(date.toDate());
        } else {
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
                         ? property.getLocalDateTime().toDate()
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
        return new Value(event.getDate() != null ? LocalDateTime.fromDate(event.getDate()) : null, this.getValueType());
    }
}

InputTypeManager.register(new Class('DateTime', DateTime), true);
