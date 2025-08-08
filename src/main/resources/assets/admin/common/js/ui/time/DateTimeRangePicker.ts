import Q from 'q';
import {DivEl} from '../../dom/DivEl';
import {Element} from '../../dom/Element';
import {LabelEl} from '../../dom/LabelEl';
import {TimeHM} from '../../util/TimeHM';
import {Timezone} from '../../util/Timezone';
import {DateTimePicker, DateTimePickerBuilder} from './DateTimePicker';
import {DayOfWeek} from './DayOfWeek';
import {DaysOfWeek} from './DaysOfWeek';
import {SelectedDateChangedEvent} from './SelectedDateChangedEvent';

export class DateTimeRangePickerBuilder {

    startDate: Date;

    endDate: Date;

    defaultFromTime: TimeHM;

    defaultToTime: TimeHM;

    startLabel: string;

    endLabel: string;

    fromPlaceholder: string;

    endPlaceholder: string;

    startingDayOfWeek: DayOfWeek = DaysOfWeek.MONDAY;

    closeOnSelect: boolean = false;

    timezone: Timezone;

    // use local timezone if timezone value is not initialized
    useLocalTimezoneIfNotPresent: boolean = false;

    setStartDate(value: Date): DateTimeRangePickerBuilder {
        this.startDate = value;
        return this;
    }

    setEndDate(value: Date): DateTimeRangePickerBuilder {
        this.endDate = value;
        return this;
    }

    setFromLabel(value: string): DateTimeRangePickerBuilder {
        this.startLabel = value;
        return this;
    }

    setToLabel(value: string): DateTimeRangePickerBuilder {
        this.endLabel = value;
        return this;
    }

    setStartingDayOfWeek(value: DayOfWeek): DateTimeRangePickerBuilder {
        this.startingDayOfWeek = value;
        return this;
    }

    setTimezone(value: Timezone): DateTimeRangePickerBuilder {
        this.timezone = value;
        return this;
    }

    setCloseOnSelect(value: boolean): DateTimeRangePickerBuilder {
        this.closeOnSelect = value;
        return this;
    }

    setUseLocalTimezoneIfNotPresent(value: boolean): DateTimeRangePickerBuilder {
        this.useLocalTimezoneIfNotPresent = value;
        return this;
    }

    setDefaultFromTime(value: TimeHM): DateTimeRangePickerBuilder {
        this.defaultFromTime = value;
        return this;
    }

    setDefaultToTime(value: TimeHM): DateTimeRangePickerBuilder {
        this.defaultToTime = value;
        return this;
    }

    setFromPlaceholder(value: string): DateTimeRangePickerBuilder {
        this.fromPlaceholder = value;
        return this;
    }

    setToPlaceholder(value: string): DateTimeRangePickerBuilder {
        this.endPlaceholder = value;
        return this;
    }

    build(): DateTimeRangePicker {
        return new DateTimeRangePicker(this);
    }

}

interface DateTimeConfig {
    value?: Date;

    defaultTime?: TimeHM;

    placeholder?: string;

    startingDayOfWeek: DayOfWeek;

    closeOnSelect: boolean;

    timezone: Timezone;

    useLocalTimezoneIfNotPresent: boolean;

}

export class DateTimeRangePicker
    extends DivEl {
    private startPicker: DateTimePicker;
    private endPicker: DateTimePicker;
    private startPickerEl: Element;
    private endPickerEl: Element;

    constructor(builder: DateTimeRangePickerBuilder) {
        super('date-time-range-picker');

        this.createElements(builder);
    }

    createElements(builder: DateTimeRangePickerBuilder): void {
        const basePickerConfig: DateTimeConfig = {
            startingDayOfWeek: builder.startingDayOfWeek,
            closeOnSelect: builder.closeOnSelect,
            timezone: builder.timezone,
            useLocalTimezoneIfNotPresent: builder.useLocalTimezoneIfNotPresent
        }

        const startPickerConfig: DateTimeConfig = {
            ...basePickerConfig,
            value: builder.startDate,
            defaultTime: builder.defaultFromTime,
            placeholder: builder.fromPlaceholder
        };

        const endPickerConfig: DateTimeConfig = {
            ...basePickerConfig,
            value: builder.endDate,
            defaultTime: builder.defaultToTime,
            placeholder: builder.endPlaceholder
        };

        this.startPicker = this.createPicker(startPickerConfig);
        this.endPicker = this.createPicker(endPickerConfig);
        this.startPickerEl = this.createPickerEl(this.startPicker, builder.startLabel, 'start-label');
        this.endPickerEl = this.createPickerEl(this.endPicker, builder.endLabel, 'end-label');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(this.startPickerEl, this.endPickerEl);

            return rendered;
        });
    }

    setStartDateTime(date: Date, userInput: boolean = true) {
        this.startPicker.setDateTime(date, userInput);
    }

    setEndDateTime(date: Date, userInput: boolean = true) {
        this.endPicker.setDateTime(date, userInput);
    }

    onStartDateTimeChanged(listener: (event: SelectedDateChangedEvent) => void) {
        this.startPicker.onSelectedDateTimeChanged(listener);
    }

    unStartDateTimeChanged(listener: (event: SelectedDateChangedEvent) => void) {
        this.startPicker.unSelectedDateTimeChanged(listener);
    }

    onEndDateTimeChanged(listener: (event: SelectedDateChangedEvent) => void) {
        this.endPicker.onSelectedDateTimeChanged(listener);
    }

    unEndDateTimeChanged(listener: (event: SelectedDateChangedEvent) => void) {
        this.endPicker.unSelectedDateTimeChanged(listener);
    }

    forceSelectedDateTimeChangedEvent() {
        this.startPicker.forceSelectedDateTimeChangedEvent();
        this.endPicker.forceSelectedDateTimeChangedEvent();
    }

    isDirty(): boolean {
        return this.startPicker.isDirty() || this.endPicker.isDirty();
    }

    isValid(): boolean {
        return this.startPicker.isValid() && this.endPicker.isValid();
    }

    setEnabled(enable: boolean) {
        this.startPicker.setEnabled(enable);
        this.endPicker.setEnabled(enable);
    }

    reset() {
        this.startPicker.resetBase();
        this.endPicker.resetBase();
    }

    clear(): void {
        this.startPicker.clear();
        this.endPicker.clear();
    }

    private createPickerBuilder(config: DateTimeConfig): DateTimePickerBuilder {
        return new DateTimePickerBuilder()
            .setStartingDayOfWeek(config.startingDayOfWeek)
            .setCloseOnSelect(config.closeOnSelect)
            .setUseLocalTimezoneIfNotPresent(config.useLocalTimezoneIfNotPresent)
            .setTimezone(config.timezone);
    }

    private createPicker(config: DateTimeConfig): DateTimePicker {
        const pickerBuilder = this.createPickerBuilder(config);

        if (config.value) {
            pickerBuilder.setDateTime(config.value);
        } else {
            pickerBuilder.setDefaultTime(config.defaultTime);
        }

        if (config.placeholder) {
            pickerBuilder.setPlaceholder(config.placeholder);
        }

        return pickerBuilder.build();
    }

    private createPickerEl(picker: DateTimePicker, label: string, className: string): Element {
        if (!label) {
            return picker;
        }

        const wrapper = new DivEl();
        wrapper.appendChildren<Element>(new LabelEl(label, picker, className), picker);

        return wrapper;
    }

}
