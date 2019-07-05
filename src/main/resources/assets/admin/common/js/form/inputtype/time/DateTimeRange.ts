module api.form.inputtype.time {

    import Property = api.data.Property;
    import Value = api.data.Value;
    import ValueType = api.data.ValueType;
    import ValueTypes = api.data.ValueTypes;
    import DateTimeRangePickerBuilder = api.ui.time.DateTimeRangePickerBuilder;
    import DateTimeRangePicker = api.ui.time.DateTimeRangePicker;
    import LocalDateTimeRange = api.util.LocalDateTimeRange;
    import i18n = api.util.i18n;

    declare const Date: DateConstructor;

    export class DateTimeRange
        extends api.form.inputtype.support.BaseInputTypeNotManagingAdd {

        private valueType: ValueType = ValueTypes.LOCAL_DATE_TIME_RANGE;
        private range: api.util.DateTimeRange | LocalDateTimeRange;

        private errors: {
            noStart: string
            endBeforeStart: string
            endInPast: string
        };

        private labels: {
            start?: string
            end?: string
        };

        constructor(config: api.form.inputtype.InputTypeViewContext) {
            super(config);
            this.readConfig(config.inputConfig);
        }

        private readConfig(inputConfig: { [element: string]: { [name: string]: string }[]; }): void {
            if (this.readConfigValue(inputConfig, 'timezone') === 'true') {
                this.valueType = ValueTypes.DATE_TIME_RANGE;
            }

            this.errors = {
                noStart: this.readConfigValue(inputConfig, 'errorNoStart') ||
                         i18n('field.dateTimeRange.errors.noStart'),
                endInPast: this.readConfigValue(inputConfig, 'errorEndInPast') ||
                           i18n('field.dateTimeRange.errors.endInPast'),
                endBeforeStart: this.readConfigValue(inputConfig, 'errorEndBeforeStart') ||
                                i18n('field.dateTimeRange.errors.endBeforeStart')
            };

            this.labels = {
                start: this.readConfigValue(inputConfig, 'labelStart'),
                end: this.readConfigValue(inputConfig, 'labelEnd')
            };
        }

        private readConfigValue(inputConfig: { [element: string]: { [name: string]: string }[]; }, name: string): string {
            const namedConfig = inputConfig[name];
            return namedConfig && namedConfig[0] && namedConfig[0].value;
        }

        getValueType(): ValueType {
            return this.valueType;
        }

        newInitialValue(): Value {
            return super.newInitialValue() || this.valueType.newNullValue();
        }

        createInputOccurrenceElement(_index: number, property: Property): api.dom.Element {
            if (this.valueType === ValueTypes.DATE_TIME_RANGE) {
                this.range = new api.util.DateTimeRange(null, null);
                return this.createInputAsDateTime(property);
            }

            this.range = new api.util.LocalDateTimeRange(null, null);
            return this.createInputAsLocalDateTime(property);
        }

        updateInputOccurrenceElement(occurrence: api.dom.Element, property: api.data.Property, unchangedOnly: boolean) {
            const dateTimePicker = <DateTimeRangePicker>occurrence;

            if (!unchangedOnly || !dateTimePicker.isDirty()) {

                const date = property.hasNonNullValue()
                             ? this.valueType === ValueTypes.DATE_TIME_RANGE
                               ? property.getDateTimeRange()
                               : property.getLocalDateTimeRange()
                             : null;

                dateTimePicker.setStartDateTime(date.getFrom() ? date.getFrom().toDate() : null);
                dateTimePicker.setEndDateTime(date.getTo() ? date.getTo().toDate() : null);

            } else if (dateTimePicker.isDirty()) {
                dateTimePicker.forceSelectedDateTimeChangedEvent();
            }
        }

        resetInputOccurrenceElement(occurrence: api.dom.Element) {
            let input = <DateTimeRangePicker>occurrence;

            input.resetBase();
        }

        hasInputElementValidUserInput(inputElement: api.dom.Element) {
            let dateTimePicker = <api.ui.time.DateTimeRangePicker>inputElement;
            return dateTimePicker.isValid();
        }

        availableSizeChanged() {
            // Nothing
        }

        valueBreaksRequiredContract(value: Value): boolean {
            return value.isNull() ||
                   !(value.getType().equals(ValueTypes.LOCAL_DATE_TIME_RANGE) || value.getType().equals(ValueTypes.DATE_TIME_RANGE));
        }

        private createInputAsLocalDateTime(property: Property): DateTimeRangePicker {
            const rangeBuilder = new DateTimeRangePickerBuilder()
                .setStartLabel(this.labels.start)
                .setEndLabel(this.labels.end);

            this.setLocalDates(rangeBuilder, property);

            const rangePicker = rangeBuilder.build();

            rangePicker.onStartDateTimeChanged((event: api.ui.time.SelectedDateChangedEvent) => {
                (<LocalDateTimeRange>this.range).setFrom(event.getDate() ? api.util.LocalDateTime.fromDate(event.getDate()) : null);
                this.notifyOccurrenceValueChanged(rangePicker, new Value(this.range, ValueTypes.LOCAL_DATE_TIME_RANGE));
            });

            rangePicker.onEndDateTimeChanged((event: api.ui.time.SelectedDateChangedEvent) => {
                (<LocalDateTimeRange>this.range).setTo(event.getDate() ? api.util.LocalDateTime.fromDate(event.getDate()) : null);
                this.notifyOccurrenceValueChanged(rangePicker, new Value(this.range, ValueTypes.LOCAL_DATE_TIME_RANGE));
            });

            return rangePicker;
        }

        private setDates(builder: DateTimeRangePickerBuilder, prop: Property) {
            if (!ValueTypes.DATE_TIME_RANGE.equals(prop.getType())) {
                prop.convertValueType(ValueTypes.DATE_TIME_RANGE);
            }

            if (prop.hasNonNullValue()) {
                const range: api.util.DateTimeRange = this.range = prop.getDateTimeRange();
                const from = range.getFrom();
                const to = range.getTo();
                if (from || to) {
                    if (from) {
                        builder.setStartDate(from.toDate());
                    }
                    if (to) {
                        builder.setEndDate(to.toDate());
                    }
                    builder.setTimezone((from || to).getTimezone());
                }
            }
        }

        private setLocalDates(builder: DateTimeRangePickerBuilder, prop: Property) {
            if (!ValueTypes.LOCAL_DATE_TIME_RANGE.equals(prop.getType())) {
                prop.convertValueType(ValueTypes.LOCAL_DATE_TIME_RANGE);
            }

            if (prop.hasNonNullValue()) {
                const range: api.util.LocalDateTimeRange = this.range = prop.getLocalDateTimeRange();
                const from = range.getFrom();
                const to = range.getTo();
                if (from || to) {
                    if (from) {
                        builder.setStartDate(from.toDate());
                    }
                    if (to) {
                        builder.setEndDate(to.toDate());
                    }
                }
            }
        }

        private createInputAsDateTime(property: Property): DateTimeRangePicker {
            const rangeBuilder = new DateTimeRangePickerBuilder()
                .setStartLabel(this.labels.start)
                .setEndLabel(this.labels.end)
                .setUseLocalTimezoneIfNotPresent(true);

            this.setDates(rangeBuilder, property);

            const rangePicker = rangeBuilder.build();

            rangePicker.onStartDateTimeChanged((event: api.ui.time.SelectedDateChangedEvent) => {
                (<api.util.DateTimeRange>this.range).setFrom(event.getDate() ? api.util.DateTime.fromDate(event.getDate()) : null);
                this.notifyOccurrenceValueChanged(rangePicker, new Value(this.range, ValueTypes.DATE_TIME_RANGE));
            });

            rangePicker.onEndDateTimeChanged((event: api.ui.time.SelectedDateChangedEvent) => {
                (<api.util.DateTimeRange>this.range).setTo(event.getDate() ? api.util.DateTime.fromDate(event.getDate()) : null);
                this.notifyOccurrenceValueChanged(rangePicker, new Value(this.range, ValueTypes.DATE_TIME_RANGE));
            });

            return rangePicker;
        }

        protected additionalValidate(recording: api.form.inputtype.InputValidationRecording) {
            if (recording.isValid() && this.range) {
                const from = this.range.getFrom();
                const to = this.range.getTo();

                if (to) {
                    if (!from) {
                        recording.setBreaksMinimumOccurrences(true);
                        recording.setAdditionalValidationRecord(
                            api.form.AdditionalValidationRecord.create()
                                .setOverwriteDefault(true)
                                .setMessage(this.errors.noStart)
                                .build());
                    } else if (to.toDate() < new Date()) {
                        recording.setBreaksMinimumOccurrences(true);
                        recording.setAdditionalValidationRecord(
                            api.form.AdditionalValidationRecord.create()
                                .setOverwriteDefault(true)
                                .setMessage(this.errors.endInPast)
                                .build());
                    } else if (to.toDate() < from.toDate()) {
                        recording.setBreaksMinimumOccurrences(true);
                        recording.setAdditionalValidationRecord(
                            api.form.AdditionalValidationRecord.create()
                                .setOverwriteDefault(true)
                                .setMessage(this.errors.endBeforeStart)
                                .build());
                    }
                }
            }
        }

        static getName(): api.form.InputTypeName {
            return new api.form.InputTypeName('DateTimeRange', false);
        }
    }

    api.form.inputtype.InputTypeManager.register(new api.Class('DateTimeRange', DateTimeRange));
}
