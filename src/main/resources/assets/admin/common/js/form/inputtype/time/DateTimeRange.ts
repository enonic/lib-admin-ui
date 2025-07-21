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
import {ObjectHelper} from '../../../ObjectHelper';
import {ArrayHelper} from '../../../util/ArrayHelper';

declare const Date: DateConstructor;

export class DateTimeRange
    extends BaseInputTypeNotManagingAdd {

    private useTimezone: boolean;
    private from: DateTime | LocalDateTime;
    private to: DateTime | LocalDateTime;
    private defaultFromTime: TimeHM;
    private defaultToTime: TimeHM;
    private fromPlaceholder: string;
    private toPlaceholder: string;
    private optionalFrom: boolean = false;

    private errors: {
        noFrom: string
        toBeforeFrom: string
        toInPast: string
        fromEqualsTo: string
    };

    private labels: {
        from?: string
        to?: string
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

        if (!this.from && !this.optionalFrom) {
            return this.errors.noFrom;
        }

        return this.getToError();
    }

    private getToError(): string {
        let from = this.from;
        if (!from && this.optionalFrom) {
            from = LocalDateTime.fromDate(new Date());
        }
        if (this.to.toDate() < new Date()) {
            return this.errors.toInPast;
        }

        if (this.to.toDate() < from.toDate()) {
            return this.errors.toBeforeFrom;
        }

        if (this.to.equals(from)) {
            return this.errors.fromEqualsTo;
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

        return ObjectHelper.isDefined(from) && ['DateTime', 'LocalDateTime'].indexOf(from.getType().toString()) === -1
            || ObjectHelper.isDefined(to) && ['DateTime', 'LocalDateTime'].indexOf(to.getType().toString()) === -1;
    }

    private readConfig(inputConfig: Record<string, any>): void {
        if (this.readConfigValue(inputConfig, 'timezone') === 'true') {
            this.useTimezone = true;
        }

        this.labels = {
            from: this.readConfigValue(inputConfig, 'fromLabel') || i18n('field.dateTimeRange.label.dateFrom'),
            to: this.readConfigValue(inputConfig, 'toLabel') || i18n('field.dateTimeRange.label.dateTo')
        };

        this.errors = {
            noFrom: this.readConfigValue(inputConfig, 'errorNoStart') ||
                     i18n('field.dateTimeRange.errors.noStart', this.labels.from, this.labels.to),
            toInPast: this.readConfigValue(inputConfig, 'errorEndInPast') ||
                       i18n('field.dateTimeRange.errors.endInPast', this.labels.to),
            toBeforeFrom: this.readConfigValue(inputConfig, 'errorEndBeforeStart') ||
                            i18n('field.dateTimeRange.errors.endBeforeStart', this.labels.from, this.labels.to),
            fromEqualsTo: this.readConfigValue(inputConfig, 'errorStartEqualsEnd') ||
                            i18n('field.dateTimeRange.errors.startEqualsEnd', this.labels.from, this.labels.to)
        };

        this.defaultFromTime = this.getDefaultTimeFromConfig(inputConfig, 'defaultFromTime');
        this.defaultToTime = this.getDefaultTimeFromConfig(inputConfig, 'defaultToTime');
        this.fromPlaceholder = this.readConfigValue(inputConfig, 'fromPlaceholder');
        this.toPlaceholder = this.readConfigValue(inputConfig, 'toPlaceholder');
        this.optionalFrom = Boolean(this.readConfigValue(inputConfig, 'optionalFrom'));
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
            .setFromLabel(this.labels.from)
            .setToLabel(this.labels.to)
            .setDefaultFromTime(this.defaultFromTime)
            .setDefaultToTime(this.defaultToTime)
            .setFromPlaceholder(this.fromPlaceholder)
            .setToPlaceholder(this.toPlaceholder);

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
            .setFromLabel(this.labels.from)
            .setToLabel(this.labels.to)
            .setUseLocalTimezoneIfNotPresent(true);

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
                    builder.setTimezone(((from || to) as DateTime).getTimezone());
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
