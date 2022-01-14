import {TextInput} from '../text/TextInput';
import {KeyHelper} from '../KeyHelper';
import {StringHelper} from '../../util/StringHelper';
import {DateHelper} from '../../util/DateHelper';
import {Event} from '../../event/Event';
import {ClassHelper} from '../../ClassHelper';
import {DayOfWeek} from './DayOfWeek';
import {Picker} from './Picker';
import {DaysOfWeek} from './DaysOfWeek';
import {DatePickerPopup, DatePickerPopupBuilder} from './DatePickerPopup';
import {SelectedDateChangedEvent} from './SelectedDateChangedEvent';

export class DatePickerBuilder {

    date: Date;

    defaultDate: Date;

    startingDayOfWeek: DayOfWeek = DaysOfWeek.MONDAY;

    closeOnSelect: boolean = true;

    setDefaultDate(value: Date): DatePickerBuilder {
        this.defaultDate = value;
        return this;
    }

    setDate(value: Date): DatePickerBuilder {
        this.date = value;
        return this;
    }

    build(): DatePicker {
        return new DatePicker(this);
    }

}

export class DatePicker
    extends Picker<DatePickerPopup> {

    constructor(builder: DatePickerBuilder) {
        super(builder, 'date-picker');
    }

    setSelectedDate(date: Date) {
        this.input.setValue(this.formatDate(date));
        this.selectedDate = date;
    }

    protected initData(builder: DatePickerBuilder) {
        if (builder.date) {
            this.setDate(builder.date);
        }

        if (builder.defaultDate) {
            this.setDefaultValueHandler(() => this.setSelectedDate(builder.defaultDate));
        }
    }

    protected handleShownEvent() {
        let onDatePickerShown = this.onDatePickerShown.bind(this);
        DatePickerShownEvent.on(onDatePickerShown);
        this.onRemoved(() => DatePickerShownEvent.un(onDatePickerShown));
    }

    protected initPopup() {
        this.popup = new DatePickerPopupBuilder().setDate(this.selectedDate).build();

        this.popup.onShown(() => {
            new DatePickerShownEvent(this).fire();
        });
    }

    protected initInput() {
        const value = this.selectedDate ? this.formatDate(this.selectedDate) : '';

        this.input = TextInput.middle(undefined, value);
        this.input.setPlaceholder('YYYY-MM-DD');
    }

    protected setupPopupListeners(builder: DatePickerBuilder) {
        super.setupPopupListeners(builder);

        this.popup.onSelectedDateChanged((e: SelectedDateChangedEvent) => {
            if (builder.closeOnSelect) {
                this.popup.hide();
            }
            this.selectedDate = e.getDate();
            this.validUserInput = true;
            this.input.setValue(this.formatDate(e.getDate()), false, true);
            this.notifySelectedDateTimeChanged(e);
            this.updateInputStyling();
        });
    }

    protected setupInputListeners() {
        super.setupInputListeners();

        this.input.onKeyUp((event: KeyboardEvent) => {
            if (KeyHelper.isArrowKey(event) || KeyHelper.isModifierKey(event)) {
                return;
            }

            let typedDate = this.input.getValue();
            this.validUserInput = true;

            if (StringHelper.isEmpty(typedDate)) {
                this.setDate(null);
                this.hidePopup();
            } else {
                let date = DateHelper.parseDate(typedDate, '-', true);
                if (date) {
                    this.setDate(date);
                    this.showPopup();
                } else {
                    this.selectedDate = null;
                    this.validUserInput = false;
                }
            }
            this.notifySelectedDateTimeChanged(new SelectedDateChangedEvent(this.selectedDate));
            this.updateInputStyling();
        });
    }

    private onDatePickerShown(event: DatePickerShownEvent) {
        if (event.getDatePicker() !== this) {
            this.hidePopup();
        }
    }

    private setDate(date: Date) {
        this.selectedDate = date;
        if (this.popup) {
            this.popup.setSelectedDate(date, true);
        }
    }

    private formatDate(date: Date): string {
        return date ? DateHelper.formatDate(date) : '';
    }
}

export class DatePickerShownEvent
    extends Event {

    private datePicker: DatePicker;

    constructor(datePicker: DatePicker) {
        super();
        this.datePicker = datePicker;
    }

    static on(handler: (event: DatePickerShownEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: DatePickerShownEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

    getDatePicker(): DatePicker {
        return this.datePicker;
    }

}
