module api.util.htmlarea.dialog {

    import FormItem = api.ui.form.FormItem;
    import Validators = api.ui.form.Validators;
    import i18n = api.util.i18n;
    import TextInput = api.ui.text.TextInput;
    import eventInfo = CKEDITOR.eventInfo;

    // With this dialog we hide original cke dialog and replicate all actions from our dialog to original one
    export class AnchorModalDialogCKE
        extends CKEBackedDialog {

        private nameField: FormItem;

        constructor(config: eventInfo) {

            super(<HtmlAreaModalDialogConfig>{
                editor: config.editor,
                dialog: config.data,
                title: i18n('dialog.anchor.title'),
                confirmation: {
                    yesCallback: () => this.getSubmitAction().execute(),
                    noCallback: () => this.close(),
                }
            });
        }

        protected getMainFormItems(): FormItem[] {
            const formItemBuilder = new ModalDialogFormItemBuilder('name', i18n('dialog.anchor.formitem.name')).setValidator(
                Validators.required);
            this.nameField = this.createFormItem(formItemBuilder);

            this.setFirstFocusField(this.nameField.getInput());

            return [this.nameField];
        }

        protected setDialogInputValues() {
            this.nameField.getInput().getEl().setValue(<string>this.ckeOriginalDialog.getValueOf('info', 'txtName'));
        }

        protected initializeActions() {
            const submitAction = new api.ui.Action(i18n('action.insert'));
            this.setSubmitAction(submitAction);

            this.addAction(submitAction.onExecuted(() => {
                if (this.validate()) {
                    const value: string = this.nameField.getInput().getEl().getValue();
                    const isAnythingSelected: boolean = !!this.getEditor().getSelection().getSelectedText();

                    if (isAnythingSelected) {
                        this.ckeOriginalDialog.setValueOf('info', 'txtName', value);
                        this.ckeOriginalDialog.getButton('ok').click();
                    } else {
                        this.getEditor().insertHtml(`<a id="${value}" name="${value}">&nbsp;</a>`);
                    }

                    this.close();
                }
            }));

            super.initializeActions();
        }

        isDirty(): boolean {
            return (<TextInput>this.nameField.getInput()).isDirty();
        }
    }
}
