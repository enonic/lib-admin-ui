module api.util.htmlarea.dialog {

    import FormItem = api.ui.form.FormItem;
    import Validators = api.ui.form.Validators;
    import i18n = api.util.i18n;
    import TextInput = api.ui.text.TextInput;
    import eventInfo = CKEDITOR.eventInfo;

    // With this dialog we hide original cke dialog and replicate all actions from our dialog to original one
    export class AnchorModalDialogCKE
        extends ModalDialog {

        private nameField: FormItem;

        private ckeAnchorDialog: CKEDITOR.dialog;

        constructor(config: eventInfo) {

            super(<HtmlAreaModalDialogConfig>{
                editor: config.editor,
                title: i18n('dialog.anchor.title'),
                confirmation: {
                    yesCallback: () => this.getSubmitAction().execute(),
                    noCallback: () => this.close(),
                }
            });

            this.ckeAnchorDialog = config.data;
            this.hideOriginalCKEAnchorDialog();
        }

        protected getMainFormItems(): FormItem[] {
            const formItemBuilder = new ModalDialogFormItemBuilder('name', i18n('dialog.anchor.formitem.name')).setValidator(
                Validators.required);
            this.nameField = this.createFormItem(formItemBuilder);

            this.setFirstFocusField(this.nameField.getInput());

            return [this.nameField];
        }

        close() {
            super.close();
            this.ckeAnchorDialog.getElement().$.style.display = 'block';
            this.ckeAnchorDialog.hide();
        }

        private hideOriginalCKEAnchorDialog() {
            this.ckeAnchorDialog.getElement().$.style.display = 'none';
            (<HTMLElement>document.getElementsByClassName('cke_dialog_background_cover')[0]).style.left = '-10000px';
            this.nameField.getInput().getEl().setValue(<string>this.ckeAnchorDialog.getValueOf('info', 'txtName'));
        }

        protected initializeActions() {
            const submitAction = new api.ui.Action(i18n('action.insert'));
            this.setSubmitAction(submitAction);

            this.addAction(submitAction.onExecuted(() => {
                if (this.validate()) {
                    this.ckeAnchorDialog.setValueOf('info', 'txtName', this.nameField.getInput().getEl().getValue());
                    this.ckeAnchorDialog.getButton('ok').click();
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
