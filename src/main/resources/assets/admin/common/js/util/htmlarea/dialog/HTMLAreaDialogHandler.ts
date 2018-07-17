module api.util.htmlarea.dialog {

    import eventInfo = CKEDITOR.eventInfo;

    import CreateHtmlAreaDialogEvent = api.util.htmlarea.editor.CreateHtmlAreaDialogEvent;
    import HtmlAreaDialogType = api.util.htmlarea.editor.HtmlAreaDialogType;

    export class HTMLAreaDialogHandler {

        private static modalDialog: ModalDialog;

        static createAndOpenDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
            let modalDialog;

            switch (event.getType()) {
            case HtmlAreaDialogType.ANCHOR:
                modalDialog = this.openAnchorDialog(event.getConfig());
                break;
            case HtmlAreaDialogType.ANCHOR_CKE:
                modalDialog = this.openAnchorDialogCKE(event.getConfig());
                break;
            case HtmlAreaDialogType.IMAGE:
                modalDialog = this.openImageDialog(event.getConfig(), event.getContent());
                break;
            case HtmlAreaDialogType.IMAGE_CKE:
                modalDialog = this.openImageDialogCKE(event.getConfig(), event.getContent());
                break;
            case HtmlAreaDialogType.LINK:
                modalDialog = this.openLinkDialog(event.getConfig(), event.getContent());
                break;
            case HtmlAreaDialogType.LINK_CKE:
                modalDialog = this.openLinkDialogCKE(event.getConfig(), event.getContent());
                break;
            case HtmlAreaDialogType.MACRO:
                modalDialog = this.openMacroDialog(event.getConfig(), event.getContent(), event.getApplicationKeys());
                break;
            case HtmlAreaDialogType.MACRO_CKE:
                modalDialog = this.openMacroDialogCKE(event.getConfig(), event.getContent(), event.getApplicationKeys());
                break;
            case HtmlAreaDialogType.SEARCHREPLACE:
                modalDialog = this.openSearchReplaceDialog(event.getConfig());
                break;
            case HtmlAreaDialogType.SEARCHREPLACE_CKE:
                modalDialog = this.openSearchReplaceDialogCKE(event.getConfig());
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
            case HtmlAreaDialogType.FULLSCREEN_CKE:
                modalDialog = this.openFullscreenDialogCKE(event.getConfig());
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

        private static openLinkDialog(config: HtmlAreaAnchor, content: api.content.ContentSummary): ModalDialog {
            return this.openDialog(new LinkModalDialog(config, content));
        }

        private static openLinkDialogCKE(config: eventInfo, content: api.content.ContentSummary): ModalDialog {
            return this.openDialog(new LinkModalDialogCKE(config, content));
        }

        private static openImageDialog(config: HtmlAreaImage, content: api.content.ContentSummary): ModalDialog {
            return this.openDialog(new ImageModalDialog(config, content));
        }

        private static openImageDialogCKE(config: eventInfo, content: api.content.ContentSummary): ModalDialog {
            return this.openDialog(new ImageModalDialogCKE(config, content));
        }

        private static openAnchorDialog(editor: HtmlAreaEditor): ModalDialog {
            return this.openDialog(new AnchorModalDialog(editor));
        }

        private static openAnchorDialogCKE(config: eventInfo): ModalDialog {
            return this.openDialog(new AnchorModalDialogCKE(config));
        }

        private static openMacroDialog(config: HtmlAreaMacro, content: api.content.ContentSummary,
                                       applicationKeys: api.application.ApplicationKey[]): ModalDialog {
            return this.openDialog(new MacroModalDialog(config, content, applicationKeys));
        }

        private static openMacroDialogCKE(config: any, content: api.content.ContentSummary,
                                          applicationKeys: api.application.ApplicationKey[]): ModalDialog {
            return this.openDialog(new MacroModalDialogCKE(config, content, applicationKeys));
        }

        private static openSearchReplaceDialog(editor: HtmlAreaEditor): ModalDialog {
            return this.openDialog(new SearchReplaceModalDialog(editor));
        }

        private static openSearchReplaceDialogCKE(config: eventInfo): ModalDialog {
            return this.openDialog(new FindAndReplaceDialogCKE(config));
        }

        private static openCodeDialog(editor: HtmlAreaEditor): ModalDialog {
            return this.openDialog(new CodeDialog(editor));
        }

        private static openCodeDialogCKE(config: eventInfo): ModalDialog {
            return this.openDialog(new CodeDialogCKE(config));
        }

        private static openCharMapDialog(editor: HtmlAreaEditor): ModalDialog {
            return this.openDialog(new CharMapDialog(editor));
        }

        private static openSpecialCharDialogCKE(config: eventInfo): ModalDialog {
            return this.openDialog(new SpecialCharDialogCKE(config));
        }

        private static openFullscreenDialogCKE(config: any): ModalDialog {
            return this.openDialog(new FullscreenDialogCKE(config));
        }

        private static openDialog(dialog: ModalDialog): ModalDialog {
            dialog.open();
            return dialog;
        }
    }
}
