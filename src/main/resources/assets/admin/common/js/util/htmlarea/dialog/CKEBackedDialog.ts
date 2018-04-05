module api.util.htmlarea.dialog {

    // With this dialog we hide original cke dialog and replicate all actions from our dialog to original one
    export abstract class CKEBackedDialog
        extends ModalDialog {

        protected ckeOriginalDialog: CKEDITOR.dialog;

        constructor(config: HtmlAreaModalDialogConfig) {
            super(config);

            this.ckeOriginalDialog = config.dialog;
            this.hideOriginalCKEDialog();
            this.setDialogInputValues();
        }

        close() {
            super.close();
            this.ckeOriginalDialog.getElement().$.style.display = 'block';
            this.ckeOriginalDialog.hide();
        }

        private hideOriginalCKEDialog() {
            this.ckeOriginalDialog.getElement().$.style.display = 'none';
            (<HTMLElement>document.getElementsByClassName('cke_dialog_background_cover')[0]).style.left = '-10000px';
        }

        protected abstract setDialogInputValues();
    }
}
