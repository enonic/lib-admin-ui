import {Timezone} from '../../util/Timezone';
import {TextInput} from '../text/TextInput';
import {KeyHelper} from '../KeyHelper';
import {StringHelper} from '../../util/StringHelper';
import {DateHelper} from '../../util/DateHelper';
import {Event} from '../../event/Event';
import {ClassHelper} from '../../ClassHelper';
import {Picker} from './Picker';
import {DateTimePickerPopup, DateTimePickerPopupBuilder} from './DateTimePickerPopup';
import {DatePickerBuilder} from './DatePicker';
import {SelectedDateChangedEvent} from './SelectedDateChangedEvent';
import {DayOfWeek} from './DayOfWeek';
import {DaysOfWeek} from './DaysOfWeek';

export class DateTimePickerBuilder {

    date: Date;

    startingDayOfWeek: DayOfWeek = DaysOfWeek.MONDAY;

    closeOnSelect: boolean = false;

    timezone: Timezone;

    // use local timezone if timezone value is not initialized
    useLocalTimezoneIfNotPresent: boolean = false;

    setDate(value: Date): DateTimePickerBuilder {
        this.date = value;
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

    constructor(builder: DateTimePickerBuilder) {
        super(builder, 'date-time-picker');
    }

    public setSelectedDateTime(date: Date, userInput?: boolean) {
        this.setDateTime(date);
        this.setInputValue(userInput);
    }

    protected initData(builder: DateTimePickerBuilder) {
        if (builder.date) {
            this.setDate(builder.date);
        }
    }

    protected handleShownEvent() {
        let onDatePickerShown = this.onDateTimePickerShown.bind(this);
        DateTimePickerShownEvent.on(onDatePickerShown);
        this.onRemoved(() => DateTimePickerShownEvent.un(onDatePickerShown));
    }

    protected initInput() {
        this.input = TextInput.middle(undefined, this.formatDateTime(this.selectedDate));
        this.input.setPlaceholder('YYYY-MM-DD hh:mm');
    }

    protected initPopup(builder: DateTimePickerBuilder) {
        let popupBuilder = new DateTimePickerPopupBuilder().setDate(this.selectedDate).setTimezone(
            builder.timezone).setUseLocalTimezoneIfNotPresent(builder.useLocalTimezoneIfNotPresent);

        this.popup = new DateTimePickerPopup(popupBuilder);
        this.popup.onShown(() => {
            new DateTimePickerShownEvent(this).fire();
        });
    }

    protected setupPopupListeners(builder: DatePickerBuilder) {
        super.setupPopupListeners(builder);

        this.popup.onSelectedDateChanged((e: SelectedDateChangedEvent) => {
            if (builder.closeOnSelect) {
                this.popup.hide();
            }
            this.setDate(e.getDate());
            this.setInputValue(true);
        });

        this.popup.onSelectedTimeChanged((hours: number, minutes: number) => {
            this.setTime(hours, minutes);
            this.setInputValue(true);
        });
    }

    protected setupInputListeners() {
        super.setupInputListeners();

        this.input.onKeyUp((event: KeyboardEvent) => {
            if (KeyHelper.isArrowKey(event) || KeyHelper.isModifierKey(event)) {
                return;
            }
            let typedDateTime = this.input.getValue();
            let date: Date = null;
            this.validUserInput = true;
            if (StringHelper.isEmpty(typedDateTime)) {
                this.setDateTime(null);
                this.hidePopup();
            } else {
                date = DateHelper.parseDateTime(typedDateTime);
                let dateLength = date && date.getFullYear().toString().length + 12;
                if (date && date.toString() !== 'Invalid Date' && typedDateTime.trim().length === dateLength) {
                    this.setDateTime(date);
                    this.showPopup();
                } else {
                    this.selectedDate = null;
                    this.validUserInput = false;
                }
            }
            this.notifySelectedDateTimeChanged(new SelectedDateChangedEvent(date));
            this.updateInputStyling();
        });
    }

    private onDateTimePickerShown(event: DateTimePickerShownEvent) {
        if (event.getDateTimePicker() !== this) {
            this.hidePopup();
        }
    }

    private setDateTime(date: Date) {
        this.selectedDate = date;
        if (this.popup) {
            this.popup.setSelectedDate(date, true);
            this.popup.setSelectedTime(date ? date.getHours() : null, date ? date.getMinutes() : null, true);
        }
    }

    private setInputValue(userInput: boolean) {
        this.validUserInput = true;
        this.input.setValue(this.formatDateTime(this.selectedDate), false, userInput);
        this.notifySelectedDateTimeChanged(new SelectedDateChangedEvent(this.selectedDate, userInput));
        this.updateInputStyling();
    }

    private setTime(hours: number, minutes: number) {
        if (!this.selectedDate) {
            let today = new Date();
            this.selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        }
        this.selectedDate.setHours(hours);
        this.selectedDate.setMinutes(minutes);
    }

    private setDate(date: Date) {
        let hours = this.selectedDate ? this.selectedDate.getHours() : 0;
        let minutes = this.selectedDate ? this.selectedDate.getMinutes() : 0;

        this.selectedDate = date;

        if (hours || minutes) {
            this.setTime(hours, minutes);
        }
    }

    private formatDateTime(date: Date): string {
        if (!date) {
            return '';
        }
        return DateHelper.formatDate(date) + ' ' + DateHelper.getFormattedTimeFromDate(date, false);
    }
}

export class DateTimePickerShownEvent
    extends Event {

    private dateTimePicker: DateTimePicker;

    constructor(dateTimePicker: DateTimePicker) {
        super();
        this.dateTimePicker = dateTimePicker;
    }

    static on(handler: (event: DateTimePickerShownEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: DateTimePickerShownEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

    getDateTimePicker(): DateTimePicker {
        return this.dateTimePicker;
    }

}
