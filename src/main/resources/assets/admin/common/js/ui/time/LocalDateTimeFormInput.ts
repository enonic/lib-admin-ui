module api.form {

    import DateTimePickerBuilder = api.ui.time.DateTimePickerBuilder;
    import DateTimePicker = api.ui.time.DateTimePicker;

    export class LocalDateTimeFormInput extends api.dom.FormInputEl {

        private localDate: DateTimePicker;

        constructor(value?: Date) {
            super('div');

            let publishFromDateTimeBuilder = new DateTimePickerBuilder();
            if (value) {
                publishFromDateTimeBuilder.setDate(value);
            }

            this.localDate = publishFromDateTimeBuilder.build();
            this.appendChild(this.localDate);
        }

        doGetValue(): string {
            return this.localDate.toString();
        }

        protected doSetValue(value: string) {
            this.localDate.setSelectedDateTime(api.util.LocalDateTime.fromString(value).toDate());
        }

        getPicker(): DateTimePicker {
            return this.localDate;
        }
    }
}
