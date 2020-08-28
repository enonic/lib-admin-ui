import {Property} from '../../../data/Property';
import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {DateTimeRangePicker, DateTimeRangePickerBuilder} from '../../../ui/time/DateTimeRangePicker';
import {i18n} from '../../../util/Messages';
import {PropertySet} from '../../../data/PropertySet';
import {LocalDateTime} from '../../../util/LocalDateTime';
import {BaseInputTypeNotManagingAdd} from '../support/BaseInputTypeNotManagingAdd';
import {DateTime} from '../../../util/DateTime';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {Element} from '../../../dom/Element';
import {SelectedDateChangedEvent} from '../../../ui/time/SelectedDateChangedEvent';
import {InputValidationRecording} from '../InputValidationRecording';
import {AdditionalValidationRecord} from '../../AdditionalValidationRecord';
import {InputTypeName} from '../../InputTypeName';
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';

declare const Date: DateConstructor;

export class DateTimeRange
    extends BaseInputTypeNotManagingAdd {

    private valueType: ValueType = ValueTypes.DATA;
    private useTimezone: boolean;
    private from: DateTime | LocalDateTime;
    private to: DateTime | LocalDateTime;

    private errors: {
        noStart: string
        endBeforeStart: string
        endInPast: string
        startEqualsEnd: string
    };

    private labels: {
        start?: string
        end?: string
    };

    constructor(config: InputTypeViewContext) {
        super(config);
        this.readConfig(config.inputConfig);
    }

    static getName(): InputTypeName {
        return new InputTypeName('DateTimeRange', false);
    }

    getValueType(): ValueType {
        return this.valueType;
    }

    newInitialValue(): Value {
        return super.newInitialValue() || this.valueType.newNullValue();
    }

    createInputOccurrenceElement(_index: number, property: Property): Element {

        [this.from, this.to] = this.getFromTo(property.getPropertySet());

        if (this.useTimezone) {
            return this.createInputAsDateTime(property);
        }

        return this.createInputAsLocalDateTime(property);
    }

    updateInputOccurrenceElement(occurrence: Element, property: Property, unchangedOnly: boolean) {
        const dateTimePicker = <DateTimeRangePicker>occurrence;

        if (!unchangedOnly || !dateTimePicker.isDirty()) {

            [this.from, this.to] = this.getFromTo(property.getPropertySet());

            dateTimePicker.setStartDateTime(this.from ? this.from.toDate() : null);
            dateTimePicker.setEndDateTime(this.to ? this.to.toDate() : null);

        } else if (dateTimePicker.isDirty()) {
            dateTimePicker.forceSelectedDateTimeChangedEvent();
        }
    }

    resetInputOccurrenceElement(occurrence: Element) {
        let input = <DateTimeRangePicker>occurrence;

        input.reset();
    }

    hasInputElementValidUserInput(inputElement: Element) {
        let dateTimePicker = <DateTimeRangePicker>inputElement;
        return dateTimePicker.isValid();
    }

    availableSizeChanged() {
        // Nothing
    }

    valueBreaksRequiredContract(value: Value): boolean {
        if (value.isNull() || !(value.getType().equals(ValueTypes.DATA))) {
            return true;
        }

        const pSet = value.getPropertySet();
        const from = pSet.getProperty('from');
        const to = pSet.getProperty('to');

        return from && from.getType() !== ValueTypes.DATE_TIME && from.getType() !== ValueTypes.LOCAL_DATE_TIME
               || to && to.getType() !== ValueTypes.DATE_TIME && to.getType() !== ValueTypes.LOCAL_DATE_TIME;
    }

    protected additionalValidate(recording: InputValidationRecording) {
        recording.setAdditionalValidationRecord(undefined);
        if (!recording.isValid() || !this.to) {
            return;
        }
        let errorMessage: string;
        if (!this.from) {
            errorMessage = this.errors.noStart;
        } else if (this.to.toDate() < new Date()) {
            errorMessage = this.errors.endInPast;
        } else if (this.to.toDate() < this.from.toDate()) {
            errorMessage = this.errors.endBeforeStart;
        } else if (this.to.equals(this.from)) {
            errorMessage = this.errors.startEqualsEnd;
        }

        if (!errorMessage) {
            return;
        }

        recording.setBreaksMinimumOccurrences(true);
        recording.setAdditionalValidationRecord(
            AdditionalValidationRecord.create()
                .setOverwriteDefault(true)
                .setMessage(errorMessage)
                .build());
    }

    private readConfig(inputConfig: { [element: string]: any; }): void {
        if (this.readConfigValue(inputConfig, 'timezone') === 'true') {
            this.useTimezone = true;
        }

        this.labels = {
            start: this.readConfigValue(inputConfig, 'labelStart') || i18n('field.dateTimeRange.label.dateFrom'),
            end: this.readConfigValue(inputConfig, 'labelEnd') || i18n('field.dateTimeRange.label.dateTo')
        };

        this.errors = {
            noStart: this.readConfigValue(inputConfig, 'errorNoStart') ||
                     i18n('field.dateTimeRange.errors.noStart', this.labels.start, this.labels.end),
            endInPast: this.readConfigValue(inputConfig, 'errorEndInPast') ||
                       i18n('field.dateTimeRange.errors.endInPast', this.labels.end),
            endBeforeStart: this.readConfigValue(inputConfig, 'errorEndBeforeStart') ||
                            i18n('field.dateTimeRange.errors.endBeforeStart', this.labels.start, this.labels.end),
            startEqualsEnd: this.readConfigValue(inputConfig, 'errorStartEqualsEnd') ||
                            i18n('field.dateTimeRange.errors.startEqualsEnd', this.labels.start, this.labels.end)
        };
    }

    private readConfigValue(inputConfig: { [element: string]: any; }, name: string): string {
        return inputConfig[name];
    }

    private createInputAsLocalDateTime(property: Property): DateTimeRangePicker {
        const rangeBuilder = new DateTimeRangePickerBuilder()
            .setStartLabel(this.labels.start)
            .setEndLabel(this.labels.end);

        this.setFromTo(rangeBuilder, property);

        const rangePicker = rangeBuilder.build();

        rangePicker.onStartDateTimeChanged((event: SelectedDateChangedEvent) => {
            this.from = event.getDate() ? LocalDateTime.fromDate(event.getDate()) : null;
            this.notifyOccurrenceValueChanged(rangePicker, this.createLocalDateTimePropertySetValue());
        });

        rangePicker.onEndDateTimeChanged((event: SelectedDateChangedEvent) => {
            this.to = event.getDate() ? LocalDateTime.fromDate(event.getDate()) : null;
            this.notifyOccurrenceValueChanged(rangePicker, this.createLocalDateTimePropertySetValue());
        });

        return rangePicker;
    }

    private createLocalDateTimePropertySetValue() {
        let pSet: PropertySet;
        if (this.from || this.to) {
            pSet = new PropertySet();
            if (this.from) {
                pSet.setLocalDateTimeByPath('from', <LocalDateTime>this.from);
            }
            if (this.to) {
                pSet.setLocalDateTimeByPath('to', <LocalDateTime>this.to);
            }
        } else {
            pSet = null;
        }
        return new Value(pSet, ValueTypes.DATA);
    }

    private createInputAsDateTime(property: Property): DateTimeRangePicker {
        const rangeBuilder = new DateTimeRangePickerBuilder()
            .setStartLabel(this.labels.start)
            .setEndLabel(this.labels.end)
            .setUseLocalTimezoneIfNotPresent(true);

        this.setFromTo(rangeBuilder, property);

        const rangePicker = rangeBuilder.build();

        rangePicker.onStartDateTimeChanged((event: SelectedDateChangedEvent) => {
            this.from = event.getDate() ? DateTime.fromDate(event.getDate()) : null;
            this.notifyOccurrenceValueChanged(rangePicker, this.createDateTimePropertySetValue());
        });

        rangePicker.onEndDateTimeChanged((event: SelectedDateChangedEvent) => {
            this.to = event.getDate() ? DateTime.fromDate(event.getDate()) : null;
            this.notifyOccurrenceValueChanged(rangePicker, this.createDateTimePropertySetValue());
        });

        return rangePicker;
    }

    private createDateTimePropertySetValue() {
        const pSet = new PropertySet();
        pSet.setLocalDateTimeByPath('from', <LocalDateTime>this.from);
        pSet.setLocalDateTimeByPath('to', <LocalDateTime>this.to);
        return new Value(pSet, ValueTypes.DATA);
    }

    private setFromTo(builder: DateTimeRangePickerBuilder, property: Property) {
        if (property.hasNonNullValue()) {
            const [from, to] = this.getFromTo(property.getPropertySet());
            if (from || to) {
                if (from) {
                    builder.setStartDate((<DateTime>from).toDate());
                }
                if (to) {
                    builder.setEndDate((<DateTime>to).toDate());
                }
                if (this.useTimezone) {
                    builder.setTimezone((<DateTime>(from || to)).getTimezone());
                }
            }
        }
    }

    private getFromTo(pSet: PropertySet): DateTime[] | LocalDateTime[] {
        if (!pSet) {
            return [];
        }
        let from;
        let to;
        if (this.useTimezone) {
            from = pSet.getDateTime('from');
            to = pSet.getDateTime('to');
        } else {
            from = pSet.getLocalDateTime('from');
            to = pSet.getLocalDateTime('to');
        }
        return [from, to];
    }
}

InputTypeManager.register(new Class('DateTimeRange', DateTimeRange), true);
