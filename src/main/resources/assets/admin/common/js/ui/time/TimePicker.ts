import {DateHelper} from '../../util/DateHelper';
import {TextInput} from '../text/TextInput';
import {KeyHelper} from '../KeyHelper';
import {StringHelper} from '../../util/StringHelper';
import {Picker} from './Picker';
import {TimePickerPopup, TimePickerPopupBuilder} from './TimePickerPopup';
import {DatePickerBuilder} from './DatePicker';
import {SelectedDateChangedEvent} from './SelectedDateChangedEvent';

export class TimePickerBuilder {

    hours: number;

    minutes: number;

    setHours(value: number): TimePickerBuilder {
        this.hours = value;
        return this;
    }

    setMinutes(value: number): TimePickerBuilder {
        this.minutes = value;
        return this;
    }

    build(): TimePicker {
        return new TimePicker(this);
    }
}

export class TimePicker
    extends Picker<TimePickerPopup> {

    constructor(builder: TimePickerBuilder) {
        super(builder, 'time-picker');
    }

    setSelectedTime(hour: number, minute: number) {
        this.input.setValue(DateHelper.formatTime(hour, minute));
        if (this.popup) {
            this.popup.setSelectedTime(hour, minute, true);
        }
    }

    protected initData(builder: TimePickerBuilder) {
        this.setTime(builder.hours, builder.minutes);
    }

    protected initPopup(builder: TimePickerBuilder) {
        this.popup = new TimePickerPopupBuilder().setHours(builder.hours).setMinutes(builder.minutes).build();
    }

    protected initInput(builder: TimePickerBuilder) {
        let value;
        if (builder.hours || builder.minutes) {
            value = DateHelper.formatTime(builder.hours, builder.minutes);
        }

        this.input = TextInput.middle(undefined, value);
        this.input.setPlaceholder('hh:mm');
    }

    protected setupPopupListeners(builder: DatePickerBuilder) {
        super.setupPopupListeners(builder);

        this.popup.onSelectedTimeChanged((hours: number, minutes: number) => {
            if (hours != null && minutes != null) {
                this.input.setValue(DateHelper.formatTime(hours, minutes), false, true);
                this.validUserInput = true;

                this.notifySelectedDateTimeChanged(new SelectedDateChangedEvent(DateHelper.dateFromTime(hours, minutes)));
            }

            this.updateInputStyling();
        });
    }

    protected setupInputListeners() {
        super.setupInputListeners();

        this.input.onKeyUp((event: KeyboardEvent) => {
            if (KeyHelper.isArrowKey(event) || KeyHelper.isModifierKey(event)) {
                return;
            }

            let typedTime = this.input.getValue();
            this.validUserInput = true;
            if (StringHelper.isEmpty(typedTime)) {
                this.setTime(null, null);
                this.hidePopup();
            } else {
                let parsedTime = /^\s*([0-2][0-9]:[0-5][0-9])\s*$/.exec(typedTime);
                if (parsedTime && parsedTime.length === 2) {
                    let splitTime = parsedTime[1].split(':');
                    this.setTime(parseInt(splitTime[0], 10), parseInt(splitTime[1], 10));
                    this.showPopup();
                } else {
                    this.validUserInput = false;
                    this.setTime(null, null);
                }
            }

            this.notifySelectedDateTimeChanged(new SelectedDateChangedEvent(this.selectedDate));
            this.updateInputStyling();
        });
    }

    private setTime(hours: number, minutes: number) {
        if (!this.selectedDate) {
            let today = new Date();
            this.selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        }
        this.selectedDate.setHours(hours);
        this.selectedDate.setMinutes(minutes);

        if (this.popup) {
            this.popup.setSelectedTime(hours, minutes, true);
        }
    }
}
