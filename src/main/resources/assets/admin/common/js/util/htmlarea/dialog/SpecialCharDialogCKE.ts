module api.util.htmlarea.dialog {

    import HTMLAreaEditorCKE = CKEDITOR.editor;
    import i18n = api.util.i18n;

    export class SpecialCharDialogCKE
        extends ModalDialog {

        // The block with chars will be taken directly from original cke dialog for maximum compatibility
        private static CHARS_BLOCK: HTMLElement;

        constructor(editor: HTMLAreaEditorCKE) {
            super(<HtmlAreaModalDialogConfig>{editor: editor, title: i18n('dialog.charmap.title'), cls: 'special-char-modal-dialog'});

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

        protected layout() {
            super.layout();

            this.initCharsBlock();
        }

        private initCharsBlock() {
            if (!!SpecialCharDialogCKE.CHARS_BLOCK) {
                this.getContentPanel().getHTMLElement().appendChild(SpecialCharDialogCKE.CHARS_BLOCK);
                return;
            }

            this.getEditor().openDialog('specialchar', (ckedialog) => {
                const shownListener = ckedialog.on('show', () => {
                    ckedialog.hide();
                    shownListener.removeListener();
                });
                SpecialCharDialogCKE.CHARS_BLOCK = ckedialog.parts.contents.getChildren().getItem(0).$;
                this.getContentPanel().getHTMLElement().appendChild(SpecialCharDialogCKE.CHARS_BLOCK);
            });
        }

    }
}
