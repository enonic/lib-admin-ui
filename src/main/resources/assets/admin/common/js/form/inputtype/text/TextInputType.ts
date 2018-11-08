module api.form.inputtype.text {

    import NumberHelper = api.util.NumberHelper;
    import DivEl = api.dom.DivEl;
    import FormInputEl = api.dom.FormInputEl;
    import Element = api.dom.Element;
    import ValueTypes = api.data.ValueTypes;
    import i18n = api.util.i18n;

    export abstract class TextInputType
        extends api.form.inputtype.support.BaseInputTypeNotManagingAdd {

        private maxLength: number;

        constructor(config: api.form.inputtype.InputTypeViewContext) {
            super(config);
            this.readConfig(config.inputConfig);

            if (NumberHelper.isNumber(this.maxLength)) {
                this.addClass('max-length-limited');
            }
        }

        protected readConfig(inputConfig: { [element: string]: { [name: string]: string }[]; }): void {
            const maxLengthConfig = inputConfig['maxLength'] ? inputConfig['maxLength'][0] : {};
            const maxLength = NumberHelper.toNumber(maxLengthConfig['value']);
            this.maxLength = maxLength > 0 ? maxLength : null;
        }

        protected updateFormInputElValue(occurrence: api.dom.FormInputEl, property: api.data.Property) {
            occurrence.setValue(property.getString());
        }

        protected initOccurenceListeners(inputEl: FormInputEl) {

            if (NumberHelper.isNumber(this.maxLength)) {

                inputEl.onValueChanged(() => {
                    const lengthCounter = Element.fromHtmlElement(
                        (<HTMLElement>inputEl.getParentElement().getHTMLElement().querySelector('.length-counter')));
                    if (lengthCounter) {
                        this.updateLengthCounterValue(lengthCounter, inputEl.getValue());
                    }
                });

                inputEl.onRendered(() => {
                    const lengthCounter = new DivEl('length-counter');
                    this.updateLengthCounterValue(lengthCounter, inputEl.getValue());

                    inputEl.getParentElement().appendChild(lengthCounter);
                });

            }

            return inputEl;
        }

        protected newValueHandler(inputEl: FormInputEl, newValue: string, isValid: boolean = true) {
            const value = isValid ? ValueTypes.STRING.newValue(newValue) : this.newInitialValue();
            this.notifyOccurrenceValueChanged(inputEl, value);
        }

        private updateLengthCounterValue(lengthCounter: DivEl, newValue: string) {
            lengthCounter.setHtml(`${this.maxLength - newValue.length}`);
        }

        protected isValid(value: string, _textInput: FormInputEl, _silent: boolean = false,
                          recording?: api.form.inputtype.InputValidationRecording): boolean {
            const lengthValid = this.isValidMaxLength(value);

            if (!lengthValid) {
                if (recording) {
                    recording.setAdditionalValidationRecord(
                        api.form.AdditionalValidationRecord.create().setOverwriteDefault(true).setMessage(
                            i18n('field.value.breaks.maxlength', this.maxLength)).build());
                }

            }

            return lengthValid;
        }

        private isValidMaxLength(value: string): boolean {
            return NumberHelper.isNumber(this.maxLength) ? value.length <= this.maxLength : true;
        }
    }
}
