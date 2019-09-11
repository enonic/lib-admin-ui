import {Timezone} from '../../util/Timezone';
import {DivEl} from '../../dom/DivEl';
import {Element} from '../../dom/Element';

export class DateTimePickerPopupBuilder {

    hours: number;

    minutes: number;

    date: Date;

    timezone: Timezone;

    // use local timezone if timezone value is not initialized
    useLocalTimezoneIfNotPresent: boolean = false;

    setDate(date: Date): DateTimePickerPopupBuilder {
        this.date = date;
        return this;
    }

    getHours(): number {
        return this.date ? this.date.getHours() : null;
    }

    getMinutes(): number {
        return this.date ? this.date.getMinutes() : null;
    }

    setTimezone(value: Timezone): DateTimePickerPopupBuilder {
        this.timezone = value;
        return this;
    }

    setUseLocalTimezoneIfNotPresent(value: boolean): DateTimePickerPopupBuilder {
        this.useLocalTimezoneIfNotPresent = value;
        return this;
    }

    isUseLocalTimezoneIfNotPresent(): boolean {
        return this.useLocalTimezoneIfNotPresent;
    }

    getTimezone(): Timezone {
        return this.timezone;
    }

    build(): DateTimePickerPopup {
        return new DateTimePickerPopup(this);
    }

}

export class DateTimePickerPopup
    extends DivEl {

    private datePickerPopup: DatePickerPopup;

    private timePickerPopup: TimePickerPopup;

    constructor(builder: DateTimePickerPopupBuilder) {
        super('date-time-dialog');

        this.datePickerPopup = new DatePickerPopupBuilder().setDate(builder.date).build();

        this.timePickerPopup =
            new TimePickerPopupBuilder().setHours(builder.getHours()).setTimezone(builder.timezone).setUseLocalTimezoneIfNotPresent(
                builder.useLocalTimezoneIfNotPresent).setMinutes(builder.getMinutes()).build();

        this.appendChildren(<Element>this.datePickerPopup, <Element>this.timePickerPopup);
    }

    onSelectedDateChanged(listener: (event: SelectedDateChangedEvent) => void) {
        this.datePickerPopup.onSelectedDateChanged(listener);
    }

    unSelectedDateChanged(listener: (event: SelectedDateChangedEvent) => void) {
        this.datePickerPopup.unSelectedDateChanged(listener);
    }

    onSelectedTimeChanged(listener: (hours: number, minutes: number) => void) {
        this.timePickerPopup.onSelectedTimeChanged(listener);
    }

    unSelectedTimeChanged(listener: (hours: number, minutes: number) => void) {
        this.timePickerPopup.unSelectedTimeChanged(listener);
    }

    setSelectedTime(hours: number, minutes: number, silent?: boolean) {
        this.timePickerPopup.setSelectedTime(hours, minutes, silent);
    }

    setSelectedDate(date: Date, silent?: boolean) {
        this.datePickerPopup.setSelectedDate(date, silent);
    }
}
