module api.form.inputtype.time {

    import Property = api.data.Property;
    import Value = api.data.Value;
    import ValueType = api.data.ValueType;
    import ValueTypes = api.data.ValueTypes;

    /**
     * Uses [[api.data.ValueType]] [[api.data.ValueTypeLocalDate]].
     */
    export class Date
        extends api.form.inputtype.support.BaseInputTypeNotManagingAdd {

        getValueType(): ValueType {
            return ValueTypes.LOCAL_DATE;
        }

        newInitialValue(): Value {
            return super.newInitialValue() || ValueTypes.LOCAL_DATE.newNullValue();
        }

        createInputOccurrenceElement(_index: number, property: Property): api.dom.Element {
            if (!ValueTypes.LOCAL_DATE.equals(property.getType())) {
                property.convertValueType(ValueTypes.LOCAL_DATE);
            }

            let datePickerBuilder = new api.ui.time.DatePickerBuilder();

            if (!property.hasNullValue()) {
                let date = property.getLocalDate();
                datePickerBuilder.setDate(date.toDate());
            }
            let datePicker = datePickerBuilder.build();

            datePicker.onSelectedDateTimeChanged((event: api.ui.time.SelectedDateChangedEvent) => {
                let value = new Value(event.getDate() != null ? api.util.LocalDate.fromDate(event.getDate()) : null,
                    ValueTypes.LOCAL_DATE);
                this.notifyOccurrenceValueChanged(datePicker, value);
            });

            return datePicker;
        }

        updateInputOccurrenceElement(occurrence: api.dom.Element, property: api.data.Property, unchangedOnly?: boolean) {
            let datePicker = <api.ui.time.DatePicker> occurrence;
            if (!unchangedOnly || !datePicker.isDirty()) {
                let date = property.hasNonNullValue() ? property.getLocalDate().toDate() : null;
                datePicker.setSelectedDate(date);
            }
        }

        resetInputOccurrenceElement(occurrence: api.dom.Element) {
            let input = <api.ui.time.DatePicker> occurrence;

            input.resetBase();
        }

        valueBreaksRequiredContract(value: Value): boolean {
            return value.isNull() || !value.getType().equals(ValueTypes.LOCAL_DATE);
        }

        hasInputElementValidUserInput(inputElement: api.dom.Element) {
            let datePicker = <api.ui.time.DatePicker>inputElement;
            return datePicker.isValid();
        }
    }
    api.form.inputtype.InputTypeManager.register(new api.Class('Date', Date));

}
