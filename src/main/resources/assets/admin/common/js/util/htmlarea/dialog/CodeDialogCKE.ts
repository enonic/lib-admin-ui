module api.util.htmlarea.dialog {
    import TextArea = api.ui.text.TextArea;
    import Action = api.ui.Action;
    import HTMLAreaEditorCKE = CKEDITOR.editor;
    import i18n = api.util.i18n;

    export class CodeDialogCKE
        extends ModalDialog {

        private textArea: TextArea;

        private okAction: Action;

        private oldData: string;

        constructor(editor: HTMLAreaEditorCKE) {
            super(<HtmlAreaModalDialogConfig>{
                editor: editor,
                title: i18n('dialog.sourcecode.title'), cls: 'source-code-modal-dialog',
                confirmation: {
                    yesCallback: () => this.okAction.execute(),
                    noCallback: () => this.close(),
                }
            });
        }

        protected layout() {
            super.layout();

            this.textArea = new TextArea('source-textarea');
            this.appendChildToContentPanel(this.textArea);
        }

        open() {
            super.open();
            this.oldData = this.getEditor().getData();
            this.textArea.setValue(this.oldData);
            this.getEl().setAttribute('spellcheck', 'false');
            this.textArea.giveFocus();
        }

        protected initializeActions() {
            this.okAction = new Action(i18n('action.ok'));

            this.addAction(this.okAction.onExecuted(() => {
                // Remove CR from input data for reliable comparison with editor data.
                const newData: string = this.textArea.getValue().replace(/\r/g, '');

                // Avoid unnecessary setData. Also preserve selection
                // when user changed his mind and goes back to wysiwyg editing.
                if (newData === this.oldData) {
                    this.close();
                }

                setTimeout(() => {
                    this.setData(newData);
                });
            }));

            super.initializeActions();
        }

        isDirty(): boolean {
            return this.textArea.isDirty();
        }

        private setData(newData: string) {
            // [IE8] Focus editor before setting selection to avoid setting data on
            // locked selection, because in case of inline editor, it won't be
            // unlocked before editable's HTML is altered. (https://dev.ckeditor.com/ticket/11585)
            this.getEditor().focus();
            this.getEditor().setData(newData, () => {
                this.close();

                // Ensure correct selection.
                const range = this.getEditor().createRange();
                range.moveToElementEditStart(this.getEditor().editable());
                range.select();
            });
        }
    }
}
