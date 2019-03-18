module api.form {
    import PropertyArray = api.data.PropertyArray;

    export interface FormItemSetOccurrencesConfig {

        context: FormContext;

        occurrenceViewContainer: api.dom.Element;

        formItemSet: FormItemSet;

        parent: FormItemSetOccurrenceView;

        propertyArray: PropertyArray;

        lazyRender?: boolean;
    }

    /*
     * A kind of a controller, which adds/removes FormItemSetOccurrenceView-s
     */
    export class FormItemSetOccurrences extends FormSetOccurrences<FormItemSetOccurrenceView> {

        private lazyRender: boolean;

        constructor(config: FormItemSetOccurrencesConfig) {
            super(<FormItemOccurrencesConfig>{
                formItem: config.formItemSet,
                propertyArray: config.propertyArray,
                occurrenceViewContainer: config.occurrenceViewContainer,
                allowedOccurrences: config.formItemSet.getOccurrences()
            });

            this.context = config.context;
            this.formSet = config.formItemSet;
            this.parent = config.parent;
            this.occurrencesCollapsed = false;
            this.lazyRender = config.lazyRender;
        }

        createNewOccurrenceView(occurrence: FormSetOccurrence<FormItemSetOccurrenceView>): FormItemSetOccurrenceView {

            const dataSet = this.getSetFromArray(occurrence);

            const newOccurrenceView = new FormItemSetOccurrenceView(<FormItemSetOccurrenceViewConfig>{
                context: this.context,
                formSetOccurrence: occurrence,
                formItemSet: <FormItemSet> this.formSet,
                parent: this.parent,
                dataSet: dataSet,
                lazyRender: this.lazyRender
            });

            newOccurrenceView.onRemoveButtonClicked((event: RemoveButtonClickedEvent<FormItemSetOccurrenceView>) => {
                this.removeOccurrenceView(event.getView());
            });

            return newOccurrenceView;
        }
    }
}
