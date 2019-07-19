module api.form.inputtype.time {

    import Property = api.data.Property;
    import Value = api.data.Value;
    import ValueType = api.data.ValueType;
    import ValueTypes = api.data.ValueTypes;
    import DateTimeRangePickerBuilder = api.ui.time.DateTimeRangePickerBuilder;
    import DateTimeRangePicker = api.ui.time.DateTimeRangePicker;
    import i18n = api.util.i18n;
    import PropertySet = api.data.PropertySet;
    import LocalDateTime = api.util.LocalDateTime;

    declare const Date: DateConstructor;

    export class DateTimeRange
        extends api.form.inputtype.support.BaseInputTypeNotManagingAdd {

        private valueType: ValueType = ValueTypes.DATA;
        private useTimezone: boolean;
        private from: api.util.DateTime | api.util.LocalDateTime;
        private to: api.util.DateTime | api.util.LocalDateTime;

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

        private readConfig(inputConfig: { [element: string]: any; }): void {
            if (this.readConfigValue(inputConfig, 'timezone') === 'true') {
                this.useTimezone = true;
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

        private readConfigValue(inputConfig: { [element: string]: any; }, name: string): string {
            return inputConfig[name];
        }

        getValueType(): ValueType {
            return this.valueType;
        }

        newInitialValue(): Value {
            return super.newInitialValue() || this.valueType.newNullValue();
        }

        createInputOccurrenceElement(_index: number, property: Property): api.dom.Element {

            [this.from, this.to] = this.getFromTo(property.getPropertySet());

            if (this.useTimezone) {
                return this.createInputAsDateTime(property);
            }

            return this.createInputAsLocalDateTime(property);
        }

        updateInputOccurrenceElement(occurrence: api.dom.Element, property: api.data.Property, unchangedOnly: boolean) {
            const dateTimePicker = <DateTimeRangePicker>occurrence;

            if (!unchangedOnly || !dateTimePicker.isDirty()) {

                [this.from, this.to] = this.getFromTo(property.getPropertySet());

                dateTimePicker.setStartDateTime(this.from ? this.from.toDate() : null);
                dateTimePicker.setEndDateTime(this.to ? this.to.toDate() : null);

            } else if (dateTimePicker.isDirty()) {
                dateTimePicker.forceSelectedDateTimeChangedEvent();
            }
        }

        resetInputOccurrenceElement(occurrence: api.dom.Element) {
            let input = <DateTimeRangePicker>occurrence;

            this.from = undefined;
            this.to = undefined;

            input.reset();
        }

        hasInputElementValidUserInput(inputElement: api.dom.Element) {
            let dateTimePicker = <api.ui.time.DateTimeRangePicker>inputElement;
            return dateTimePicker.isValid();
        }

        availableSizeChanged() {
            // Nothing
        }

        valueBreaksRequiredContract(value: Value): boolean {
            if (value.isNull() || !(value.getType().equals(ValueTypes.DATA))) {
                return true;
            }

            const pSet = value.getPropertySet();
            const from = pSet.getProperty('from');
            const to = pSet.getProperty('to');

            return from && from.getType() !== ValueTypes.DATE_TIME && from.getType() !== ValueTypes.LOCAL_DATE_TIME
                   || to && to.getType() !== ValueTypes.DATE_TIME && to.getType() !== ValueTypes.LOCAL_DATE_TIME;
        }

        private createInputAsLocalDateTime(property: Property): DateTimeRangePicker {
            const rangeBuilder = new DateTimeRangePickerBuilder()
                .setStartLabel(this.labels.start)
                .setEndLabel(this.labels.end);

            this.setFromTo(rangeBuilder, property);

            const rangePicker = rangeBuilder.build();

            rangePicker.onStartDateTimeChanged((event: api.ui.time.SelectedDateChangedEvent) => {
                this.from = event.getDate() ? api.util.LocalDateTime.fromDate(event.getDate()) : null;
                this.notifyOccurrenceValueChanged(rangePicker, this.createLocalDateTimePropertySetValue());
            });

            rangePicker.onEndDateTimeChanged((event: api.ui.time.SelectedDateChangedEvent) => {
                this.to = event.getDate() ? api.util.LocalDateTime.fromDate(event.getDate()) : null;
                this.notifyOccurrenceValueChanged(rangePicker, this.createLocalDateTimePropertySetValue());
            });

            return rangePicker;
        }

        private createLocalDateTimePropertySetValue() {
            let pSet;
            if (this.from || this.to) {
                pSet = new PropertySet();
                if (this.from) {
                    pSet.setLocalDateTimeByPath('from', <LocalDateTime>this.from);
                }
                if (this.to) {
                    pSet.setLocalDateTimeByPath('to', <LocalDateTime>this.to);
                }
            } else {
                pSet = null;
            }
            return new Value(pSet, ValueTypes.DATA);
        }

        private createInputAsDateTime(property: Property): DateTimeRangePicker {
            const rangeBuilder = new DateTimeRangePickerBuilder()
                .setStartLabel(this.labels.start)
                .setEndLabel(this.labels.end)
                .setUseLocalTimezoneIfNotPresent(true);

            this.setFromTo(rangeBuilder, property);

            const rangePicker = rangeBuilder.build();

            rangePicker.onStartDateTimeChanged((event: api.ui.time.SelectedDateChangedEvent) => {
                this.from = event.getDate() ? api.util.DateTime.fromDate(event.getDate()) : null;
                this.notifyOccurrenceValueChanged(rangePicker, this.createDateTimePropertySetValue());
            });

            rangePicker.onEndDateTimeChanged((event: api.ui.time.SelectedDateChangedEvent) => {
                this.to = event.getDate() ? api.util.DateTime.fromDate(event.getDate()) : null;
                this.notifyOccurrenceValueChanged(rangePicker, this.createDateTimePropertySetValue());
            });

            return rangePicker;
        }

        private createDateTimePropertySetValue() {
            const pSet = new PropertySet();
            pSet.setLocalDateTimeByPath('from', <LocalDateTime>this.from);
            pSet.setLocalDateTimeByPath('to', <LocalDateTime>this.to);
            return new Value(pSet, ValueTypes.DATA);
        }

        private setFromTo(builder: DateTimeRangePickerBuilder, property: Property) {
            if (property.hasNonNullValue()) {
                const [from, to] = this.getFromTo(property.getPropertySet());
                if (from || to) {
                    if (from) {
                        builder.setStartDate(from.toDate());
                    }
                    if (to) {
                        builder.setEndDate(to.toDate());
                    }
                    if (this.useTimezone) {
                        builder.setTimezone((<util.DateTime>(from || to)).getTimezone());
                    }
                }
            }
        }

        private getFromTo(pSet: PropertySet): util.DateTime[] | util.LocalDateTime[] {
            if (!pSet) {
                return [];
            }
            let from;
            let to;
            if (this.useTimezone) {
                from = pSet.getDateTime('from');
                to = pSet.getDateTime('to');
            } else {
                from = pSet.getLocalDateTime('from');
                to = pSet.getLocalDateTime('to');
            }
            return [from, to];
        }

        protected additionalValidate(recording: api.form.inputtype.InputValidationRecording) {
            recording.setAdditionalValidationRecord(undefined);

            if (recording.isValid()) {
                if (this.to) {
                    if (!this.from) {
                        recording.setBreaksMinimumOccurrences(true);
                        recording.setAdditionalValidationRecord(
                            api.form.AdditionalValidationRecord.create()
                                .setOverwriteDefault(true)
                                .setMessage(this.errors.noStart)
                                .build());
                    } else if (this.to.toDate() < new Date()) {
                        recording.setBreaksMinimumOccurrences(true);
                        recording.setAdditionalValidationRecord(
                            api.form.AdditionalValidationRecord.create()
                                .setOverwriteDefault(true)
                                .setMessage(this.errors.endInPast)
                                .build());
                    } else if (this.to.toDate() < this.from.toDate()) {
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
