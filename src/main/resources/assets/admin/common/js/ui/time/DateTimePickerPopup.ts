import {Timezone} from '../../util/Timezone';
import {DivEl} from '../../dom/DivEl';
import {DatePickerPopup, DatePickerPopupBuilder} from './DatePickerPopup';
import {SelectedDateChangedEvent} from './SelectedDateChangedEvent';
import {TimePickerPopup, TimePickerPopupBuilder} from './TimePickerPopup';

export class DateTimePickerPopupBuilder {

    manageDate: boolean;

    manageTime: boolean;

    hours: number;

    minutes: number;

    date: Date;

    timezone: Timezone;

    // use local timezone if timezone value is not initialized
    useLocalTimezoneIfNotPresent: boolean = false;

    setManageDate(value: boolean): DateTimePickerPopupBuilder {
        this.manageDate = value;
        return this;
    }

    setManageTime(value: boolean): DateTimePickerPopupBuilder {
        this.manageTime = value;
        return this;
    }

    setDate(date: Date): DateTimePickerPopupBuilder {
        this.date = date;
        return this;
    }

    getHours(): number {
        return this.date?.getHours();
    }

    getMinutes(): number {
        return this.date?.getMinutes();
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

    private readonly datePickerPopup: DatePickerPopup;

    private readonly timePickerPopup: TimePickerPopup;

    constructor(builder: DateTimePickerPopupBuilder) {
        super('date-time-dialog');

        if (builder.manageDate) {
            this.datePickerPopup =
                new DatePickerPopupBuilder()
                .setDate(builder.date)
                .build();

            this.appendChild(this.datePickerPopup);
        }

        if (builder.manageTime) {
            this.timePickerPopup =
                new TimePickerPopupBuilder()
                    .setHours(builder.getHours())
                    .setTimezone(builder.timezone)
                    .setUseLocalTimezoneIfNotPresent(builder.useLocalTimezoneIfNotPresent)
                    .setMinutes(builder.getMinutes())
                    .build();

            this.appendChild(this.timePickerPopup);
        }
    }

    onSelectedDateChanged(listener: (event: SelectedDateChangedEvent) => void) {
        this.datePickerPopup?.onSelectedDateChanged(listener);
    }

    unSelectedDateChanged(listener: (event: SelectedDateChangedEvent) => void) {
        this.datePickerPopup?.unSelectedDateChanged(listener);
    }

    onSelectedTimeChanged(listener: (hours: number, minutes: number) => void) {
        this.timePickerPopup?.onSelectedTimeChanged(listener);
    }

    unSelectedTimeChanged(listener: (hours: number, minutes: number) => void) {
        this.timePickerPopup?.unSelectedTimeChanged(listener);
    }

    setSelectedTime(hours: number, minutes: number, silent?: boolean) {
        this.timePickerPopup?.setSelectedTime(hours, minutes, silent);
    }

    setSelectedDate(date: Date, silent?: boolean) {
        this.datePickerPopup?.setSelectedDate(date, silent);
    }
}
