module api.ui.time {

    export class DatePickerBuilder {

        year: number;

        month: number;

        selectedDate: Date;

        startingDayOfWeek: DayOfWeek = DaysOfWeek.MONDAY;

        closeOnSelect: boolean = true;

        setYear(value: number): DatePickerBuilder {
            this.year = value;
            return this;
        }

        setMonth(value: number): DatePickerBuilder {
            this.month = value;
            return this;
        }

        setSelectedDate(value: Date): DatePickerBuilder {
            this.selectedDate = value;
            return this;
        }

        build(): DatePicker {
            return new DatePicker(this);
        }

    }

    export class DatePicker extends Picker {

        private selectedDate: Date;

        private selectedDateChangedListeners: {(event: SelectedDateChangedEvent) : void}[] = [];

        constructor(builder: DatePickerBuilder) {
            super(builder, 'date-picker');
        }

        protected initData(builder: DatePickerBuilder) {
            this.selectedDate = builder.selectedDate;
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
                this.notifySelectedDateChanged(e);
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

                if (api.util.StringHelper.isEmpty(typedDate)) {
                    this.popup.setSelectedDate(null);
                    this.selectedDate = null;
                    this.validUserInput = true;
                    this.hidePopup();
                    this.notifySelectedDateChanged(new SelectedDateChangedEvent(null));
                } else {
                    let date = api.util.DateHelper.parseDate(typedDate, '-', true);
                    if (date) {
                        this.selectedDate = date;
                        this.validUserInput = true;
                        this.popup.setSelectedDate(date);
                        this.notifySelectedDateChanged(new SelectedDateChangedEvent(date));
                        this.showPopup();
                    } else {
                        this.selectedDate = null;
                        this.validUserInput = false;
                        this.notifySelectedDateChanged(new SelectedDateChangedEvent(null));
                    }
                }
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

        onSelectedDateChanged(listener: (event: SelectedDateChangedEvent) => void) {
            this.selectedDateChangedListeners.push(listener);
        }

        unSelectedDateChanged(listener: (event: SelectedDateChangedEvent) => void) {
            this.selectedDateChangedListeners = this.selectedDateChangedListeners.filter((curr) => {
                return curr !== listener;
            });
        }

        private notifySelectedDateChanged(event: SelectedDateChangedEvent) {
            this.selectedDateChangedListeners.forEach((listener) => {
                listener(event);
            });
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
