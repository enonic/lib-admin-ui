module api.ui.time {

    import Timezone = api.util.Timezone;

    export class DateTimeRangePickerBuilder {

        startDate: Date;

        endDate: Date;

        startLabel: string;

        endLabel: string;

        startingDayOfWeek: DayOfWeek = DaysOfWeek.MONDAY;

        closeOnSelect: boolean = false;

        timezone: Timezone;

        // use local timezone if timezone value is not initialized
        useLocalTimezoneIfNotPresent: boolean = false;

        setStartDate(value: Date): DateTimeRangePickerBuilder {
            this.startDate = value;
            return this;
        }

        setEndDate(value: Date): DateTimeRangePickerBuilder {
            this.endDate = value;
            return this;
        }

        setStartLabel(value: string): DateTimeRangePickerBuilder {
            this.startLabel = value;
            return this;
        }

        setEndLabel(value: string): DateTimeRangePickerBuilder {
            this.endLabel = value;
            return this;
        }

        setStartingDayOfWeek(value: DayOfWeek): DateTimeRangePickerBuilder {
            this.startingDayOfWeek = value;
            return this;
        }

        setTimezone(value: Timezone): DateTimeRangePickerBuilder {
            this.timezone = value;
            return this;
        }

        setCloseOnSelect(value: boolean): DateTimeRangePickerBuilder {
            this.closeOnSelect = value;
            return this;
        }

        setUseLocalTimezoneIfNotPresent(value: boolean): DateTimeRangePickerBuilder {
            this.useLocalTimezoneIfNotPresent = value;
            return this;
        }

        build(): DateTimeRangePicker {
            return new DateTimeRangePicker(this);
        }

    }

    export class DateTimeRangePicker
        extends api.dom.DivEl {
        private startLabel: string;
        private startPicker: api.ui.time.DateTimePicker;
        private endLabel: string;
        private endPicker: api.ui.time.DateTimePicker;

        constructor(builder: DateTimeRangePickerBuilder) {
            super('date-time-range-picker');
            this.startLabel = builder.startLabel;
            this.startPicker = this.createPicker(builder, 0);
            this.endLabel = builder.endLabel;
            this.endPicker = this.createPicker(builder, 1);
        }

        doRender(): Q.Promise<boolean> {
            return super.doRender().then((rendered: boolean) => {
                let startEl: api.dom.Element;
                let endEl: api.dom.Element;
                if (this.startLabel) {
                    startEl = new api.dom.DivEl();
                    startEl.appendChildren<api.dom.Element>(new api.dom.LabelEl(this.startLabel, this.startPicker, 'start-label'),
                        this.startPicker);
                } else {
                    startEl = this.startPicker;
                }

                if (this.endLabel) {
                    endEl = new api.dom.DivEl();
                    endEl.appendChildren<api.dom.Element>(new api.dom.LabelEl(this.endLabel, this.endPicker, 'end-label'), this.endPicker);
                } else {
                    endEl = this.endPicker;
                }

                this.appendChildren(startEl, endEl);

                return rendered;
            });
        }

        private createPicker(builder: DateTimeRangePickerBuilder, index: number = 0): DateTimePicker {
            const b = new DateTimePickerBuilder()
                .setStartingDayOfWeek(builder.startingDayOfWeek)
                .setCloseOnSelect(builder.closeOnSelect)
                .setUseLocalTimezoneIfNotPresent(builder.useLocalTimezoneIfNotPresent)
                .setCloseOnSelect(true)
                .setTimezone(builder.timezone);

            switch (index) {
            case 1:
                if (builder.endDate) {
                    b.setDate(builder.endDate);
                }
                break;
            case 0:
            default:
                if (builder.startDate) {
                    b.setDate(builder.startDate);
                }
                break;
            }

            return b.build();
        }

        public setStartDateTime(date: Date) {
            this.startPicker.setSelectedDateTime(date, false);
        }

        public setEndDateTime(date: Date) {
            this.endPicker.setSelectedDateTime(date, false);
        }

        onStartDateTimeChanged(listener: (event: SelectedDateChangedEvent) => void) {
            this.startPicker.onSelectedDateTimeChanged(listener);
        }

        unStartDateTimeChanged(listener: (event: SelectedDateChangedEvent) => void) {
            this.startPicker.unSelectedDateTimeChanged(listener);
        }

        onEndDateTimeChanged(listener: (event: SelectedDateChangedEvent) => void) {
            this.endPicker.onSelectedDateTimeChanged(listener);
        }

        unEndDateTimeChanged(listener: (event: SelectedDateChangedEvent) => void) {
            this.endPicker.unSelectedDateTimeChanged(listener);
        }

        forceSelectedDateTimeChangedEvent() {
            this.startPicker.forceSelectedDateTimeChangedEvent();
            this.endPicker.forceSelectedDateTimeChangedEvent();
        }

        isDirty(): boolean {
            return this.startPicker.isDirty() || this.endPicker.isDirty();
        }

        isValid(): boolean {
            return this.startPicker.isValid() && this.endPicker.isValid();
        }

        public reset() {
            this.startPicker.resetBase();
            this.endPicker.resetBase();
        }

    }
}
