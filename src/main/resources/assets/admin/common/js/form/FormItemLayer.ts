module api.form {

    import PropertySet = api.data.PropertySet;
    import PropertyArray = api.data.PropertyArray;
    import FocusSwitchEvent = api.ui.FocusSwitchEvent;

    export class FormItemLayer {

        private context: FormContext;

        private formItems: FormItem[];

        private parentEl: api.dom.Element;

        private formItemViews: FormItemView[] = [];

        private parent: FormItemOccurrenceView;

        public static debug: boolean = false;

        constructor(context: FormContext) {
            this.context = context;
        }

        setFormItems(formItems: FormItem[]): FormItemLayer {
            this.formItems = formItems;
            return this;
        }

        setParentElement(parentEl: api.dom.Element): FormItemLayer {
            this.parentEl = parentEl;
            return this;
        }

        setParent(value: FormItemOccurrenceView): FormItemLayer {
            this.parent = value;
            return this;
        }

        layout(propertySet: PropertySet, validate: boolean = true): wemQ.Promise<FormItemView[]> {

            this.formItemViews = [];

            return this.doLayoutPropertySet(propertySet, validate).then(() => {
                return wemQ<FormItemView[]>(this.formItemViews);
            });
        }

        private setShowEmptyFormItemSetOccurrences(propertySet: PropertySet, name: string) {
            const propertyArray: PropertyArray = propertySet.getPropertyArray(name);

            if (!propertyArray || propertyArray.getSize() === 0) {
                if (!this.context) {
                    this.context = FormContext.create().setShowEmptyFormItemSetOccurrences(false).build();
                } else {
                    this.context.setShowEmptyFormItemSetOccurrences(false);
                }
            }
        }

        private doLayoutPropertySet(propertySet: PropertySet, validate: boolean = true): wemQ.Promise<void> {

            const inputs: InputView[] = [];

            const layoutPromises: wemQ.Promise<void>[] = this.formItems.map((formItem: FormItem) => {
                let formItemView;

                if (api.ObjectHelper.iFrameSafeInstanceOf(formItem, FormItemSet)) {

                    const formItemSet: FormItemSet = <FormItemSet>formItem;

                    this.setShowEmptyFormItemSetOccurrences(propertySet, formItemSet.getName());

                    formItemView = new FormItemSetView(<FormItemSetViewConfig>{
                        context: this.context,
                        formItemSet: formItemSet,
                        parent: this.parent,
                        parentDataSet: propertySet
                    });
                }

                if (api.ObjectHelper.iFrameSafeInstanceOf(formItem, FieldSet)) {

                    const fieldSet: FieldSet = <FieldSet>formItem;
                    formItemView = new FieldSetView(<FieldSetViewConfig>{
                        context: this.context,
                        fieldSet: fieldSet,
                        parent: this.parent,
                        dataSet: propertySet
                    });
                }

                if (api.ObjectHelper.iFrameSafeInstanceOf(formItem, Input)) {

                    const input: Input = <Input>formItem;

                    formItemView = new InputView(<InputViewConfig>{
                        context: this.context,
                        input: input,
                        parent: this.parent,
                        parentDataSet: propertySet
                    });

                    inputs.push(formItemView);
                }

                if (api.ObjectHelper.iFrameSafeInstanceOf(formItem, FormOptionSet)) {

                    const formOptionSet: FormOptionSet = <FormOptionSet>formItem;

                    this.setShowEmptyFormItemSetOccurrences(propertySet, formOptionSet.getName());

                    formItemView = new api.form.FormOptionSetView(<FormOptionSetViewConfig>{
                        context: this.context,
                        formOptionSet: formOptionSet,
                        parent: this.parent,
                        parentDataSet: propertySet
                    });
                }

                if (api.ObjectHelper.iFrameSafeInstanceOf(formItem, FormOptionSetOption)) {

                    const formOptionSetOption: FormOptionSetOption = <FormOptionSetOption>formItem;
                    formItemView = new api.form.FormOptionSetOptionView(<FormOptionSetOptionViewConfig>{
                        context: this.context,
                        formOptionSetOption: formOptionSetOption,
                        parent: this.parent,
                        parentDataSet: propertySet
                    });
                }

                this.formItemViews.push(formItemView);

                return formItemView.layout(validate);

            });

            this.parentEl.onRendered(() => {
                this.formItemViews.map(formItemView => this.parentEl.appendChild(formItemView, true));
            });

            // Bind next focus targets
            if (inputs.length > 1) {
                FocusSwitchEvent.on((event: FocusSwitchEvent) => {
                    const inputTypeView = event.getInputTypeView();
                    const lastIndex = inputs.length - 1;
                    let currentIndex = -1;
                    inputs.map((input) => input.getInputTypeView()).some((input, index) => {
                        // quick equality check
                        if (input.getElement() === inputTypeView.getElement()) {
                            currentIndex = index;
                            return true;
                        }
                        return false;
                    });

                    if (currentIndex >= 0) {
                        const nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
                        inputs[nextIndex].giveFocus();
                    }
                });
            }

            return wemQ.all(layoutPromises).spread<void>(() => {
                return wemQ<void>(null);
            });
        }

        update(propertySet: PropertySet, unchangedOnly?: boolean): wemQ.Promise<void> {
            if (FormItemLayer.debug) {
                console.debug('FormItemLayer.update' + (unchangedOnly ? ' (unchanged only)' : ''), this, propertySet);
            }

            const updatePromises = this.formItemViews.map((formItemView: FormItemView) => {
                return formItemView.update(propertySet, unchangedOnly);
            });

            return wemQ.all(updatePromises).spread<void>(() => {
                return wemQ<void>(null);
            }).catch(api.DefaultErrorHandler.handle);
        }

        reset() {
            this.formItemViews.forEach((formItemView: FormItemView) => {
                formItemView.reset();
            });
        }

        toggleHelpText(show?: boolean) {
            this.formItemViews.forEach((formItemView: FormItemView) => {
                formItemView.toggleHelpText(show);
            });
        }

        hasHelpText(): boolean {
            return this.formItemViews.some((formItemView: FormItemView) => {
                return formItemView.hasHelpText();
            });
        }
    }
}
