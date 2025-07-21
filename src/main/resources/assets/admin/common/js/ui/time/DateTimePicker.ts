import {Timezone} from '../../util/Timezone';
import {TextInput} from '../text/TextInput';
import {KeyHelper} from '../KeyHelper';
import {StringHelper} from '../../util/StringHelper';
import {DateHelper} from '../../util/DateHelper';
import {Event} from '../../event/Event';
import {ClassHelper} from '../../ClassHelper';
import {Picker, PickerBuilder} from './Picker';
import {DateTimePickerPopup, DateTimePickerPopupBuilder} from './DateTimePickerPopup';
import {SelectedDateChangedEvent} from './SelectedDateChangedEvent';
import {DayOfWeek} from './DayOfWeek';
import {DaysOfWeek} from './DaysOfWeek';
import {ObjectHelper} from '../../ObjectHelper';
import {TimeHM} from '../../util/TimeHM';

export class DateTimePickerBuilder
    extends PickerBuilder {

    dateTime: Date;

    timezone: Timezone;

    startingDayOfWeek: DayOfWeek = DaysOfWeek.MONDAY;

    closeOnSelect: boolean = false;

    // use local timezone if timezone value is not initialized
    useLocalTimezoneIfNotPresent: boolean = false;

    inputPlaceholder: string = 'YYYY-MM-DD hh:mm';

    manageDate: boolean = true;

    manageTime: boolean = true;

    defaultValue: Date;

    defaultTime: TimeHM;

    setPlaceholder(value: string): DateTimePickerBuilder {
        this.inputPlaceholder = value;
        return this;
    }

    setDefaultTime(value: TimeHM): DateTimePickerBuilder {
        this.defaultTime = value;
        return this;
    }

    setDefaultValue(value: Date): DateTimePickerBuilder {
        this.defaultValue = value;
        return this;
    }

    setDateTime(value: Date): DateTimePickerBuilder {
        this.dateTime = value;
        return this;
    }

    setStartingDayOfWeek(value: DayOfWeek): DateTimePickerBuilder {
        this.startingDayOfWeek = value;
        return this;
    }

    setTimezone(value: Timezone): DateTimePickerBuilder {
        this.timezone = value;
        return this;
    }

    setCloseOnSelect(value: boolean): DateTimePickerBuilder {
        this.closeOnSelect = value;
        return this;
    }

    setUseLocalTimezoneIfNotPresent(value: boolean): DateTimePickerBuilder {
        this.useLocalTimezoneIfNotPresent = value;
        return this;
    }

    build(): DateTimePicker {
        return new DateTimePicker(this);
    }

}

export class DateTimePicker
    extends Picker<DateTimePickerPopup> {

    protected builder: DateTimePickerBuilder;

    protected selectedDateTime: Date;

    private selectedDateTimeChangedListeners: ((event: SelectedDateChangedEvent) => void)[] = [];

    constructor(builder: DateTimePickerBuilder, cls: string = '') {
        super(builder, `date-time-picker ${cls}`);

        this.initData();
    }

    notifySelectedDateTimeChanged(event: SelectedDateChangedEvent): void {
        this.selectedDateTimeChangedListeners.forEach((listener) => listener(event));
    }

    forceSelectedDateTimeChangedEvent(): void {
        this.notifySelectedDateTimeChanged(new SelectedDateChangedEvent(this.selectedDateTime));
    }

    onSelectedDateTimeChanged(listener: (event: SelectedDateChangedEvent) => void): void {
        this.selectedDateTimeChangedListeners.push(listener);
    }

    unSelectedDateTimeChanged(listener: (event: SelectedDateChangedEvent) => void): void {
        this.selectedDateTimeChangedListeners =
            this.selectedDateTimeChangedListeners.filter((curr) => curr !== listener);
    }

    protected initData(): void {
        if (this.builder.dateTime) {
            this.setDateTime(this.builder.dateTime, false);
        }
    }

    protected createInput(): TextInput {
        const input: TextInput = TextInput.middle('', this.formatDateTime());
        input.setPlaceholder(this.builder.inputPlaceholder);

        return input;
    }

    protected createPopup(): DateTimePickerPopup {
        const popupBuilder: DateTimePickerPopupBuilder = new DateTimePickerPopupBuilder()
            .setDate(this.selectedDateTime)
            .setManageDate(this.builder.manageDate)
            .setManageTime(this.builder.manageTime)
            .setCloseOnSelect(this.builder.closeOnSelect);

        if (!this.selectedDateTime) {
            popupBuilder.setDefaultTime(this.builder.defaultTime);
        }

        if (this.builder.timezone) {
            popupBuilder.setTimezone(this.builder.timezone);
        }

        if (this.builder.useLocalTimezoneIfNotPresent) {
            popupBuilder.setUseLocalTimezoneIfNotPresent(true);
        }

        if (this.builder.defaultValue) {
            popupBuilder.setDefaultValue(this.builder.defaultValue);
        }

        return new DateTimePickerPopup(popupBuilder);
    }

    protected setupPopupListeners(): void {
        super.setupPopupListeners();

        this.popup.onSelectedDateChanged((e: SelectedDateChangedEvent) => {
            if (this.builder.closeOnSelect) {
                this.popup.hide();
            }

            const newDate: Date = new Date(e.getDate());

            if (this.builder.manageTime) {
                if (this.selectedDateTime) {
                    newDate.setHours(this.selectedDateTime.getHours());
                    newDate.setMinutes(this.selectedDateTime.getMinutes());
                } else if (this.builder.defaultTime) {
                    newDate.setHours(this.builder.defaultTime.hours);
                    newDate.setMinutes(this.builder.defaultTime.minutes);
                }
            }

            this.setDateTime(newDate);
        });

        if (this.builder.manageTime) {
            this.popup.onSelectedTimeChanged((time: TimeHM) => {
                this.setTime(time);
                this.setInputValue();
            });
        }

        this.popup.onSubmit(() => this.setDefaultDateTime());

        this.handleShownEvent();
    }

    private handleShownEvent(): void {
        const onAnyDateTimePickerShown = (event: DateTimePickerShownEvent) => {
            if (event.getDateTimePicker() !== this) {
                this.hidePopup();
            }
        };

        const onThisDateTimePickerShown = () => {
            if (!this.selectedDateTime) {
                this.popup.resetCalendar();
            }
            new DateTimePickerShownEvent(this).fire();
            DateTimePickerShownEvent.on(onAnyDateTimePickerShown);
        };

        this.popup.onShown(() => onThisDateTimePickerShown());
        this.popup.onHidden(() => DateTimePickerShownEvent.un(onAnyDateTimePickerShown));
        this.onRemoved(() => DateTimePickerShownEvent.un(onAnyDateTimePickerShown));
    }

    protected getParsedValue(value: string): Date | TimeHM {
        return DateHelper.parseDateTime(value);
    }

    protected setParsedValue(value: Date | TimeHM): void {
        if (value instanceof Date) {
            this.setDateTime(value);
        } else {
            this.setTime(value);
        }
    }

    private setDefaultDateTime(): void {
        if (!this.selectedDateTime) {
            this.setDateTime(this.popup.getSelectedDateTime());
        }
    }

    protected setupInputListeners(): void {
        super.setupInputListeners();

        this.input.onKeyUp((event: KeyboardEvent) => {
            if (KeyHelper.isArrowKey(event) || KeyHelper.isModifierKey(event) ||
                KeyHelper.isTabKey(event) || KeyHelper.isSystemKey(event)) {
                return;
            }

            this.validUserInput = true;
            const inputValue: string = this.input.getValue();

            if (StringHelper.isEmpty(inputValue)) {
                this.selectedDateTime = null;
                this.hidePopup();
            } else {
                const parsedValue: Date | TimeHM = this.getParsedValue(inputValue.trim());

                if (!!parsedValue) {
                    this.setParsedValue(parsedValue);
                    this.showPopup();
                } else {
                    this.selectedDateTime = null;
                    this.validUserInput = false;
                }
            }
            this.notifySelectedDateTimeChanged(new SelectedDateChangedEvent(this.selectedDateTime));
            this.updateInputStyling();
        });
    }

    private setInputValue(userInput: boolean = true): void {
        this.validUserInput = true;
        this.input.setValue(this.formatDateTime(), false, userInput);

        if (userInput) {
            this.notifySelectedDateTimeChanged(new SelectedDateChangedEvent(this.selectedDateTime, true));
        }

        this.updateInputStyling();
    }

    public setDateTime(date: Date, userInput: boolean = true): void {
        if (this.builder.manageDate) {
            this.setDate(date);
        }

        if (this.builder.manageTime && ObjectHelper.isDefined(date)) {
            this.setTime(new TimeHM(date.getHours(), date.getMinutes()));
        }

        this.setInputValue(userInput);
    }

    private setDate(date: Date): void {
        this.selectedDateTime = date;

        if (this.popup) {
            this.popup.setSelectedDate(date, true);
        }
    }

    setTime(time: TimeHM): void {
        const isFirstInit: boolean = !this.selectedDateTime;

        if (isFirstInit) {
            this.selectedDateTime = new Date();
        }

        this.selectedDateTime.setHours(time.hours);
        this.selectedDateTime.setMinutes(time.minutes);
        this.selectedDateTime.setSeconds(0);

        if (this.popup) {
            this.popup.setSelectedTime(time, true);
        }

        if (isFirstInit) {
            this.setInputValue();
        }
    }

    protected formatDateTime(): string {
        let result: string = '';

        if (this.selectedDateTime) {
            if (this.builder.manageDate) {
                result += DateHelper.formatDate(this.selectedDateTime);
            }

            if (this.builder.manageTime) {
                if (result) {
                    result += ' ';
                }

                result += DateHelper.getFormattedTimeFromDate(this.selectedDateTime, false);
            }
        }

        return result;
    }
}

export class DateTimePickerShownEvent
    extends Event {

    private readonly dateTimePicker: DateTimePicker;

    constructor(dateTimePicker: DateTimePicker) {
        super();
        this.dateTimePicker = dateTimePicker;
    }

    static on(handler: (event: DateTimePickerShownEvent) => void): void {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: DateTimePickerShownEvent) => void): void {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

    getDateTimePicker(): DateTimePicker {
        return this.dateTimePicker;
    }
}
