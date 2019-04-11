module api.form.inputtype.number {

    import ValueType = api.data.ValueType;
    import ValueTypes = api.data.ValueTypes;
    import Value = api.data.Value;
    import Property = api.data.Property;

    export class Long
        extends NumberInputType {

        constructor(config: api.form.inputtype.InputTypeViewContext) {
            super(config);
        }

        getValueType(): ValueType {
            return ValueTypes.LONG;
        }

        newInitialValue(): Value {
            return super.newInitialValue() || ValueTypes.LONG.newNullValue();
        }

        createInputOccurrenceElement(_index: number, property: Property): api.dom.Element {
            if (!ValueTypes.LONG.equals(property.getType())) {
                property.convertValueType(ValueTypes.LONG);
            }

            let inputEl = api.ui.text.TextInput.middle(undefined, this.getPropertyValue(property));
            inputEl.setName(this.getInput().getName() + '-' + property.getIndex());
            inputEl.setAutocomplete(true);

            inputEl.onValueChanged((event: api.ValueChangedEvent) => {

                let isValid = this.isValid(event.getNewValue());
                let value = isValid ? ValueTypes.LONG.newValue(event.getNewValue()) : this.newInitialValue();

                this.notifyOccurrenceValueChanged(inputEl, value);
                inputEl.updateValidationStatusOnUserInput(isValid);
            });

            this.initPropertyListeners(property, inputEl);

            return inputEl;
        }

        private initPropertyListeners(property: Property, inputEl: api.ui.text.TextInput) {
            const propertyValueChangedListener = () => this.updateInputOccurrenceElement(inputEl, property, true);

            property.onPropertyValueChanged(propertyValueChangedListener);

            inputEl.onRemoved(() => {
                property.unPropertyValueChanged(propertyValueChangedListener);
            });
        }

        protected isValid(value: string, recording?: api.form.inputtype.InputValidationRecording): boolean {
            if (!api.util.NumberHelper.isWholeNumber(+value)) {
                return false;
            }
            return super.isValid(value, recording);
        }

        protected updateFormInputElValue(occurrence: api.dom.FormInputEl, property: Property) {
            occurrence.setValue(this.getPropertyValue(property));
        }

        resetInputOccurrenceElement(occurrence: api.dom.Element) {
            let input = <api.ui.text.TextInput>occurrence;

            input.resetBaseValues();
        }

        valueBreaksRequiredContract(value: Value): boolean {
            return value.isNull() || !value.getType().equals(ValueTypes.LONG);
        }

        hasInputElementValidUserInput(inputElement: api.dom.Element, recording ?: api.form.inputtype.InputValidationRecording) {
            let value = <api.ui.text.TextInput>inputElement;

            return this.isValid(value.getValue(), recording);
        }
    }

    api.form.inputtype.InputTypeManager.register(new api.Class('Long', Long));
}
