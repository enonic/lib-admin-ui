module api.ui.time {

    import DateHelper = api.util.DateHelper;

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

    export class TimePicker extends Picker {

        constructor(builder: TimePickerBuilder) {
            super(builder, 'time-picker');
        }

        protected initData(builder: TimePickerBuilder) {
            this.setTime(builder.hours, builder.minutes);
        }

        protected initPopup(builder: TimePickerBuilder) {
            this.popup = new TimePickerPopupBuilder().
                setHours(builder.hours).
                setMinutes(builder.minutes).
                build();
        }

        protected initInput(builder: TimePickerBuilder) {
            let value;
            if (builder.hours || builder.minutes) {
                value = DateHelper.formatTime(builder.hours, builder.minutes);
            }

            this.input = api.ui.text.TextInput.middle(undefined, value);
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
                if (api.ui.KeyHelper.isArrowKey(event) || api.ui.KeyHelper.isModifierKey(event)) {
                    return;
                }

                let typedTime = this.input.getValue();
                this.validUserInput = true;
                if (api.util.StringHelper.isEmpty(typedTime)) {
                    this.setTime(null, null);
                    this.hidePopup();
                } else {
                    let parsedTime = typedTime.match(/^\s*([0-2][0-9]:[0-5][0-9])\s*$/);
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

        setSelectedTime(hour: number, minute: number) {
            this.input.setValue(DateHelper.formatTime(hour, minute));
            if (this.popup) {
                this.popup.setSelectedTime(hour, minute, true);
            }
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
}
