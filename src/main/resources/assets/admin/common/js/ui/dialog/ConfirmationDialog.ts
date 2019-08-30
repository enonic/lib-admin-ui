module api.ui.dialog {

    import i18n = api.util.i18n;

    export class ConfirmationDialog extends ModalDialog {

        private questionEl: api.dom.H6El;
        private yesCallback: () => void;
        private noCallback: () => void;
        private invokeNoCallbackOnClose: boolean;

        protected yesAction: api.ui.Action;
        protected noAction: api.ui.Action;

        constructor(config: ModalDialogConfig = {}) {
            super({
                title: config.title || i18n('dialog.confirm.title'),
                closeIconCallback: config.closeIconCallback || (() => this.close()),
                class: 'confirmation-dialog'
            });
        }

        protected initElements() {
            super.initElements();

            this.questionEl = new api.dom.H6El('question');
            this.noAction = new api.ui.Action(i18n('action.no'), 'esc');
            this.yesAction = new api.ui.Action(i18n('action.yes'));
            this.invokeNoCallbackOnClose = false;
        }

        protected initListeners() {
            super.initListeners();

            this.noAction.onExecuted(() => {
                this.invokeNoCallbackOnClose = false;
                this.close();

                if (this.noCallback) {
                    this.noCallback();
                }
            });

            this.yesAction.onExecuted(() => {
                this.invokeNoCallbackOnClose = false;
                this.close();

                if (this.yesCallback) {
                    this.yesCallback();
                }
            });
        }

        doRender(): Q.Promise<boolean> {
            return super.doRender().then((rendered) => {
                this.appendChildToContentPanel(this.questionEl);
                this.addAction(this.yesAction, true);
                this.addAction(this.noAction).addClass('cancel');

                return rendered;
            });
        }

        setQuestion(question: string): ConfirmationDialog {
            this.questionEl.getEl().setInnerHtml(question);
            return this;
        }

        setYesCallback(callback: ()=>void): ConfirmationDialog {
            this.yesCallback = callback;
            return this;
        }

        setNoCallback(callback: () => void): ConfirmationDialog {
            this.noCallback = callback;
            return this;
        }

        setInvokeNoCallbackOnClose(value: boolean) {
            this.invokeNoCallbackOnClose = value;
        }

        open() {
            api.ui.mask.BodyMask.get().addClass('confirmation-dialog-mask');
            api.dom.Body.get().appendChild(this);
            super.open();

            this.dialogContainer.addClass('confirmation-dialog-container');
        }

        close() {
            super.close();
            api.ui.mask.BodyMask.get().removeClass('confirmation-dialog-mask');
            this.remove();

            if (this.invokeNoCallbackOnClose) {
                this.noCallback();
            }
        }
    }

}
