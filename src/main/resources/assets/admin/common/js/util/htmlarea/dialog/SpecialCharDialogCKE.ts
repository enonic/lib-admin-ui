module api.util.htmlarea.dialog {

    import i18n = api.util.i18n;
    import eventInfo = CKEDITOR.eventInfo;

    export class SpecialCharDialogCKE
        extends CKEBackedDialog {

        // The block with chars will be taken directly from original cke dialog for maximum compatibility
        private charsBlock: any;

        constructor(config: eventInfo) {
            super(<HtmlAreaModalDialogConfig>{
                editor: config.editor,
                dialog: config.data,
                title: i18n('dialog.charmap.title'),
                cls: 'special-char-modal-dialog'
            });

            this.initEventListeners();
        }

        private initEventListeners() {
            this.onClicked((event: any) => {
                const isSpecialCharClicked: boolean = event.target.tagName === 'A' || event.target.parentElement.tagName === 'A';

                if (isSpecialCharClicked) {
                    this.close();
                }
            });
        }

        close() {
            super.close();
            // bringing chars block back otherwise dialog opening fails
            (<any>this.ckeOriginalDialog).parts.contents.append(this.charsBlock);
        }

        protected setDialogInputValues() {
            this.initCharsBlock();
        }

        private initCharsBlock() {
            this.charsBlock = (<any>this.ckeOriginalDialog).parts.contents.getChildren().getItem(0);
            this.getContentPanel().getHTMLElement().appendChild(this.charsBlock.$);
        }

    }
}
