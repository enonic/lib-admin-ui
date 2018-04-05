module api.util.htmlarea.dialog {

    import i18n = api.util.i18n;
    import eventInfo = CKEDITOR.eventInfo;

    export class SpecialCharDialogCKE
        extends CKEBackedDialog {

        // The block with chars will be taken directly from original cke dialog for maximum compatibility
        private static CHARS_BLOCK: HTMLElement;

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

        protected setDialogInputValues() {
            this.initCharsBlock();
        }

        private initCharsBlock() {
            if (!!SpecialCharDialogCKE.CHARS_BLOCK) {
                this.getContentPanel().getHTMLElement().appendChild(SpecialCharDialogCKE.CHARS_BLOCK);
                return;
            }

            SpecialCharDialogCKE.CHARS_BLOCK = (<any>this.ckeOriginalDialog).parts.contents.getChildren().getItem(0).$;
            this.getContentPanel().getHTMLElement().appendChild(SpecialCharDialogCKE.CHARS_BLOCK);
        }

    }
}
