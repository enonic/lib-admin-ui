module api.util.htmlarea.dialog {

    import TextArea = api.ui.text.TextArea;
    import HTMLAreaBuilderCKE = api.util.htmlarea.editor.HTMLAreaBuilderCKE;
    import CreateHtmlAreaDialogEvent = api.util.htmlarea.editor.CreateHtmlAreaDialogEvent;
    declare var CONFIG;

    export class FullscreenDialogCKE
        extends ModalDialog {

        private textArea: TextArea;

        private config: any;

        private fseditor: CKEDITOR.editor;

        constructor(config: any) {
            super(<HtmlAreaModalDialogConfig>{
                editor: config.editor,
                title: i18n('dialog.fullscreen.title'),
                cls: 'fullscreen-modal-dialog'
            });

            this.config = config;

            (<CKEDITOR.editor>this.getEditor()).focusManager.lock();
            this.addListeners();
        }

        private addListeners() {
            const createHtmlAreaDialogHandler = () => {
                if (HTMLAreaDialogHandler.getOpenDialog() === this) {
                    return;
                }
                this.addClass('masked');

                HTMLAreaDialogHandler.getOpenDialog().onRemoved(() => {
                    this.removeClass('masked');
                });
            };

            CreateHtmlAreaDialogEvent.on(createHtmlAreaDialogHandler);

            this.onRemoved(() => {
                CreateHtmlAreaDialogEvent.un(createHtmlAreaDialogHandler);
            });
        }

        show() {
            super.show();
            this.initEditor();
            this.fseditor.setData(this.getEditor().getData());
        }

        hide() {
            (<CKEDITOR.editor>this.getEditor()).focusManager.unlock();
            this.getEditor().setData(this.fseditor.getData());
            this.fseditor.destroy();
            setTimeout(() => {
                (<CKEDITOR.editor>this.getEditor()).focus();
            }, 50);
            super.hide();
        }

        private initEditor() {
            const fseditor = new HTMLAreaBuilderCKE()
                .setEditorContainerId(this.textArea.getId())
                .setAssetsUri(CONFIG.assetsUri)
                .setInline(false)
                .onCreateDialog(this.config.createDialogListeners[0])
                .setKeydownHandler(this.config.keydownHandler)
                .setContentPath(this.config.contentPath)
                .setContent(this.config.content)
                .setApplicationKeys(this.config.applicationKeys)
                .setTools(this.config.customToolConfig)
                .setEditableSourceCode(this.config.editableSourceCode)
                .setFullscreenMode(true)
                .createEditor();

            fseditor.on('instanceReady', () => {
                this.removeTooltip();
                fseditor.focus();
            });

            this.fseditor = fseditor;
        }

        private removeTooltip() {
            this.getHTMLElement().getElementsByTagName('iframe')[0].removeAttribute('title');
        }

        protected layout() {
            super.layout();

            this.textArea = new TextArea('fullscreen-textarea');
            this.appendChildToContentPanel(this.textArea);
        }

    }
}
