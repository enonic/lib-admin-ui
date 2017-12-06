module api.ui.time {

    export class DatePickerBuilder {

        date: Date;

        startingDayOfWeek: DayOfWeek = DaysOfWeek.MONDAY;

        closeOnSelect: boolean = true;

        setDate(value: Date): DatePickerBuilder {
            this.date = value;
            return this;
        }

        build(): DatePicker {
            return new DatePicker(this);
        }

    }

    export class DatePicker extends Picker {

        constructor(builder: DatePickerBuilder) {
            super(builder, 'date-picker');
        }

        protected initData(builder: DatePickerBuilder) {
            if (builder.date) {
                this.setDate(builder.date);
            }
        }

        protected handleShownEvent() {
            let onDatePickerShown = this.onDatePickerShown.bind(this);
            DatePickerShownEvent.on(onDatePickerShown);
            this.onRemoved(() => DatePickerShownEvent.un(onDatePickerShown));
        }

        protected initPopup() {
            this.popup = new DatePickerPopupBuilder().
                setDate(this.selectedDate).
                build();

            this.popup.onShown(() => {
                new DatePickerShownEvent(this).fire();
            });
        }

        protected initInput() {
            const value = this.selectedDate ? this.formatDate(this.selectedDate) : '';

            this.input = api.ui.text.TextInput.middle(undefined, value);
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
                if (api.ui.KeyHelper.isArrowKey(event) || api.ui.KeyHelper.isModifierKey(event)) {
                    return;
                }

                let typedDate = this.input.getValue();
                this.validUserInput = true;

                if (api.util.StringHelper.isEmpty(typedDate)) {
                    this.setDate(null);
                    this.hidePopup();
                } else {
                    let date = api.util.DateHelper.parseDate(typedDate, '-', true);
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

        setSelectedDate(date: Date) {
            this.input.setValue(this.formatDate(date));
            this.selectedDate = date;
        }

        private setDate(date: Date) {
            this.selectedDate = date;
            if (this.popup) {
                this.popup.setSelectedDate(date, true);
            }
        }

        private formatDate(date: Date): string {
            return date ? api.util.DateHelper.formatDate(date) : '';
        }
    }

    export class DatePickerShownEvent extends api.event.Event {

        private datePicker: DatePicker;

        constructor(datePicker: DatePicker) {
            super();
            this.datePicker = datePicker;
        }

        getDatePicker(): DatePicker {
            return this.datePicker;
        }

        static on(handler: (event: DatePickerShownEvent) => void) {
            api.event.Event.bind(api.ClassHelper.getFullName(this), handler);
        }

        static un(handler?: (event: DatePickerShownEvent) => void) {
            api.event.Event.unbind(api.ClassHelper.getFullName(this), handler);
        }

    }
}
