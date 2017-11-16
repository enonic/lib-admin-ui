module api.form {

    import PropertyArray = api.data.PropertyArray;

    export class FormItemOccurrenceView extends api.dom.DivEl {

        protected formItemOccurrence: FormItemOccurrence<FormItemOccurrenceView>;

        private removeButtonClickedListeners: {(event: RemoveButtonClickedEvent<FormItemOccurrenceView>): void}[] = [];

        protected helpText: HelpTextContainer;

        constructor(className: string, formItemOccurrence: FormItemOccurrence<FormItemOccurrenceView>) {
            super(className);
            this.formItemOccurrence = formItemOccurrence;
        }

        toggleHelpText(show?: boolean) {
            if (!!this.helpText) {
                this.helpText.toggleHelpText(show);
            }
        }

        getDataPath(): api.data.PropertyPath {
            throw new Error('Must be implemented by inheritor');
        }

        public layout(_validate: boolean = true): wemQ.Promise<void> {
            return wemQ<void>(null);
        }

        public update(_propertyArray: PropertyArray, _unchangedOnly?: boolean): wemQ.Promise<void> {
            return wemQ<void>(null);
        }

        hasValidUserInput(_recording?: api.form.inputtype.InputValidationRecording): boolean {

            throw new Error('Must be implemented by inheritor');
        }

        onRemoveButtonClicked(listener: (event: RemoveButtonClickedEvent<FormItemOccurrenceView>)=>void) {
            this.removeButtonClickedListeners.push(listener);
        }

        unRemoveButtonClicked(listener: (event: RemoveButtonClickedEvent<FormItemOccurrenceView>)=>void) {
            this.removeButtonClickedListeners.filter((currentListener: (event: RemoveButtonClickedEvent<FormItemOccurrenceView>)=>void) => {
                return currentListener !== listener;
            });
        }

        notifyRemoveButtonClicked() {
            this.removeButtonClickedListeners.forEach((listener: (event: RemoveButtonClickedEvent<FormItemOccurrenceView>)=>void) => {
                listener.call(this, new RemoveButtonClickedEvent(this));
            });
        }

        getIndex(): number {
            return this.formItemOccurrence.getIndex();
        }

        refresh() {
            throw new Error('Must be implemented by inheritor');
        }

        giveFocus(): boolean {
            return false;
        }
    }
}
