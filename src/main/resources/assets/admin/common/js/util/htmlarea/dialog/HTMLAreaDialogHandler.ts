module api.util.htmlarea.dialog {

    import HTMLAreaEditorCKE = CKEDITOR.editor;

    export class HTMLAreaDialogHandler {

        private static modalDialog: ModalDialog;

        static createAndOpenDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
            let modalDialog;

            switch (event.getType()) {
            case HtmlAreaDialogType.ANCHOR:
                modalDialog = this.openAnchorDialog(event.getConfig());
                break;
            case HtmlAreaDialogType.IMAGE:
                modalDialog = this.openImageDialog(event.getConfig(), event.getContent());
                break;
            case HtmlAreaDialogType.LINK:
                modalDialog = this.openLinkDialog(event.getConfig());
                break;
            case HtmlAreaDialogType.MACRO:
                modalDialog = this.openMacroDialog(event.getConfig(), event.getContent(), event.getApplicationKeys());
                break;
            case HtmlAreaDialogType.SEARCHREPLACE:
                modalDialog = this.openSearchReplaceDialog(event.getConfig());
                break;
            case HtmlAreaDialogType.CODE:
                modalDialog = this.openCodeDialog(event.getConfig());
                break;
            case HtmlAreaDialogType.CODE_CKE:
                modalDialog = this.openCodeDialogCKE(event.getConfig());
                break;
            case HtmlAreaDialogType.CHARMAP:
                modalDialog = this.openCharMapDialog(event.getConfig());
                break;
            case HtmlAreaDialogType.SPECIALCHAR_CKE:
                modalDialog = this.openSpecialCharDialogCKE(event.getConfig());
                break;
            }

            if (modalDialog) {
                this.modalDialog = modalDialog;
                modalDialog.onHidden(() => {
                    this.modalDialog = null;
                });
            }

            return this.modalDialog;
        }

        static getOpenDialog(): ModalDialog {
            return this.modalDialog;
        }

        private static openLinkDialog(config: HtmlAreaAnchor): ModalDialog {
            return this.openDialog(new LinkModalDialog(config));
        }

        private static openImageDialog(config: HtmlAreaImage, content: api.content.ContentSummary): ModalDialog {
            return this.openDialog(new ImageModalDialog(config, content));
        }

        private static openAnchorDialog(editor: HtmlAreaEditor): ModalDialog {
            return this.openDialog(new AnchorModalDialog(editor));
        }

        private static openMacroDialog(config: HtmlAreaMacro, content: api.content.ContentSummary,
                                       applicationKeys: api.application.ApplicationKey[]): ModalDialog {
            return this.openDialog(new MacroModalDialog(config, content, applicationKeys));
        }

        private static openSearchReplaceDialog(editor: HtmlAreaEditor): ModalDialog {
            return this.openDialog(new SearchReplaceModalDialog(editor));
        }

        private static openCodeDialog(editor: HtmlAreaEditor): ModalDialog {
            return this.openDialog(new CodeDialog(editor));
        }

        private static openCodeDialogCKE(editor: HTMLAreaEditorCKE): ModalDialog {
            return this.openDialog(new CodeDialogCKE(editor));
        }

        private static openCharMapDialog(editor: HtmlAreaEditor): ModalDialog {
            return this.openDialog(new CharMapDialog(editor));
        }

        private static openSpecialCharDialogCKE(editor: HTMLAreaEditorCKE): ModalDialog {
            return this.openDialog(new SpecialCharDialogCKE(editor));
        }

        private static openDialog(dialog: ModalDialog): ModalDialog {
            dialog.open();
            return dialog;
        }
    }
}
