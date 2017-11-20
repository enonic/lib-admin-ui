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

        private selectedTimeChangedListeners: {(event: SelectedDateChangedEvent) : void}[] = [];

        constructor(builder: TimePickerBuilder) {
            super(builder, 'time-picker');
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

                    this.notifySelectedTimeChanged(new SelectedDateChangedEvent(DateHelper.dateFromTime(hours, minutes)));
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
                if (api.util.StringHelper.isEmpty(typedTime)) {
                    this.validUserInput = true;
                    this.popup.setSelectedTime(null, null);
                    if (this.popup.isVisible()) {
                        this.popup.hide();
                    }
                } else {
                    let parsedTime = typedTime.match(/^[0-2][0-9]:[0-5][0-9]$/);
                    if (parsedTime && parsedTime.length === 1) {
                        let splitTime = parsedTime[0].split(':');
                        this.validUserInput = true;
                        this.popup.setSelectedTime(parseInt(splitTime[0], 10), parseInt(splitTime[1], 10));
                        if (!this.popup.isVisible()) {
                            this.popup.show();
                        }
                    } else {
                        this.validUserInput = false;
                        this.popup.setSelectedTime(null, null);
                    }
                }

                this.updateInputStyling();
            });
        }

        setSelectedTime(hour: number, minute: number) {
            this.input.setValue(DateHelper.formatTime(hour, minute));
            if (this.popup) {
                this.popup.setSelectedTime(hour, minute, true);
            }
        }

        onSelectedTimeChanged(listener: (event: SelectedDateChangedEvent) => void) {
            this.selectedTimeChangedListeners.push(listener);
        }

        unSelectedTimeChanged(listener: (event: SelectedDateChangedEvent) => void) {
            this.selectedTimeChangedListeners = this.selectedTimeChangedListeners.filter((curr) => {
                return curr !== listener;
            });
        }

        private notifySelectedTimeChanged(event: SelectedDateChangedEvent) {
            this.selectedTimeChangedListeners.forEach((listener) => {
                listener(event);
            });
        }
    }
}
