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
import {AdditionalValidationRecord} from '../../AdditionalValidationRecord';
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';
import {InputTypeName} from '../../InputTypeName';
import {TimeHM} from '../../../util/TimeHM';

declare const Date: DateConstructor;

export class DateTimeRange
    extends BaseInputTypeNotManagingAdd {

    private useTimezone: boolean;
    private from: DateTime | LocalDateTime;
    private to: DateTime | LocalDateTime;
    private defaultStartTime: TimeHM;
    private defaultEndTime: TimeHM;

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
        return ValueTypes.DATA;
    }

    createInputOccurrenceElement(_index: number, property: Property): Element {
        [this.from, this.to] = this.getFromTo(property.getPropertySet());

        if (this.useTimezone) {
            return this.createInputAsDateTime(property);
        }

        return this.createInputAsLocalDateTime(property);
    }

    updateInputOccurrenceElement(occurrence: Element, property: Property, unchangedOnly: boolean) {
        const dateTimePicker = occurrence as DateTimeRangePicker;

        if (!unchangedOnly || !dateTimePicker.isDirty()) {

            [this.from, this.to] = this.getFromTo(property.getPropertySet());

            dateTimePicker.setStartDateTime(this.from ? this.from.toDate() : null, false);
            dateTimePicker.setEndDateTime(this.to ? this.to.toDate() : null, false);

        } else if (dateTimePicker.isDirty()) {
            dateTimePicker.forceSelectedDateTimeChangedEvent();
        }
    }

    resetInputOccurrenceElement(occurrence: Element): void {
        super.resetInputOccurrenceElement(occurrence);
        const input: DateTimeRangePicker = occurrence as DateTimeRangePicker;

        input.reset();
    }

    clearInputOccurrenceElement(occurrence: Element): void{
        super.clearInputOccurrenceElement(occurrence);

        (occurrence as DateTimeRangePicker).clear();
    }

    setEnabledInputOccurrenceElement(occurrence: Element, enable: boolean) {
        const input: DateTimeRangePicker = occurrence as DateTimeRangePicker;

        input.setEnabled(enable);
    }

    doValidateUserInput(inputEl: DateTimeRangePicker) {
        super.doValidateUserInput(inputEl);

        const error: string = inputEl.isValid() ? this.getRangeError() : i18n('field.value.invalid');

        if (error) {
            const record: AdditionalValidationRecord =
                AdditionalValidationRecord.create().setMessage(error).build();
            this.occurrenceValidationState.get(inputEl.getId()).addAdditionalValidation(record);
        }
    }

    private getRangeError(): string {
        if (!this.to) {
            return null;
        }

        if (!this.from) {
            return this.errors.noStart;
        }

        return this.getToError();
    }

    private getToError(): string {
        if (this.to.toDate() < new Date()) {
            return this.errors.endInPast;
        }

        if (this.to.toDate() < this.from.toDate()) {
            return  this.errors.endBeforeStart;
        }

        if (this.to.equals(this.from)) {
            return this.errors.startEqualsEnd;
        }

        return null;
    }

    valueBreaksRequiredContract(value: Value): boolean {
        if (value.isNull() || !(value.getType().equals(ValueTypes.DATA))) {
            return true;
        }

        const pSet: PropertySet = value.getPropertySet();
        const from: Property = pSet.getProperty('from');
        const to: Property = pSet.getProperty('to');

        return from && from.getType() !== ValueTypes.DATE_TIME && from.getType() !== ValueTypes.LOCAL_DATE_TIME
               || to && to.getType() !== ValueTypes.DATE_TIME && to.getType() !== ValueTypes.LOCAL_DATE_TIME;
    }

    private readConfig(inputConfig: Record<string, any>): void {
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

        this.defaultStartTime = this.getDefaultTimeFromConfig(inputConfig, 'defaultStartTime');
        this.defaultEndTime = this.getDefaultTimeFromConfig(inputConfig, 'defaultEndTime');
    }

    private getDefaultTimeFromConfig(inputConfig: Record<string, string>, name: string): TimeHM {
        const time: string = this.readConfigValue(inputConfig, name);
        if (!time) {
            return null;
        }
        const timeArray: string[] = time.split(':');
        return new TimeHM(parseInt(timeArray[0] || '0'), parseInt(timeArray[1] || '0'));
    }

    private readConfigValue(inputConfig: Record<string, any>, name: string): string {
        return inputConfig[name];
    }

    private createInputAsLocalDateTime(property: Property): DateTimeRangePicker {
        const rangeBuilder: DateTimeRangePickerBuilder = new DateTimeRangePickerBuilder()
            .setStartLabel(this.labels.start)
            .setEndLabel(this.labels.end)
            .setDefaultStartTime(this.defaultStartTime)
            .setDefaultEndTime(this.defaultEndTime);

        this.setFromTo(rangeBuilder, property);

        const rangePicker: DateTimeRangePicker = rangeBuilder.build();

        rangePicker.onStartDateTimeChanged((event: SelectedDateChangedEvent) => {
            this.from = event.getDate() ? LocalDateTime.fromDate(event.getDate()) : null;
            this.handleOccurrenceInputValueChanged(rangePicker);
        });

        rangePicker.onEndDateTimeChanged((event: SelectedDateChangedEvent) => {
            this.to = event.getDate() ? LocalDateTime.fromDate(event.getDate()) : null;
            this.handleOccurrenceInputValueChanged(rangePicker);
        });

        return rangePicker;
    }

    protected getValue(): Value {
        return this.useTimezone ?  this.createDateTimePropertySetValue() : this.createLocalDateTimePropertySetValue();
    }

    private createLocalDateTimePropertySetValue() {
        let pSet: PropertySet;

        if (this.from || this.to) {
            pSet = new PropertySet();
            if (this.from) {
                pSet.setLocalDateTimeByPath('from', this.from as LocalDateTime);
            }
            if (this.to) {
                pSet.setLocalDateTimeByPath('to', this.to as LocalDateTime);
            }
        } else {
            pSet = null;
        }

        return new Value(pSet, ValueTypes.DATA);
    }

    private createInputAsDateTime(property: Property): DateTimeRangePicker {
        const rangeBuilder: DateTimeRangePickerBuilder = new DateTimeRangePickerBuilder()
            .setStartLabel(this.labels.start)
            .setEndLabel(this.labels.end)
            .setUseLocalTimezone(true);

        this.setFromTo(rangeBuilder, property);

        const rangePicker: DateTimeRangePicker = rangeBuilder.build();

        rangePicker.onStartDateTimeChanged((event: SelectedDateChangedEvent) => {
            this.from = event.getDate() ? DateTime.fromDate(event.getDate()) : null;
            this.handleOccurrenceInputValueChanged(rangePicker);
        });

        rangePicker.onEndDateTimeChanged((event: SelectedDateChangedEvent) => {
            this.to = event.getDate() ? DateTime.fromDate(event.getDate()) : null;
            this.handleOccurrenceInputValueChanged(rangePicker);
        });

        return rangePicker;
    }

    private createDateTimePropertySetValue() {
        const pSet: PropertySet = new PropertySet();
        pSet.setLocalDateTimeByPath('from', this.from as LocalDateTime);
        pSet.setLocalDateTimeByPath('to', this.to as LocalDateTime);
        return new Value(pSet, ValueTypes.DATA);
    }

    private setFromTo(builder: DateTimeRangePickerBuilder, property: Property) {
        if (property.hasNonNullValue()) {
            const [from, to] = this.getFromTo(property.getPropertySet());
            if (from || to) {
                if (from) {
                    builder.setStartDate((from as DateTime).toDate());
                }
                if (to) {
                    builder.setEndDate((to as DateTime).toDate());
                }
                if (this.useTimezone) {
                    builder.setUseLocalTimezone(true);
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
