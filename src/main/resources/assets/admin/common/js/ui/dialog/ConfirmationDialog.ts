import * as Q from 'q';
import {i18n} from '../../util/Messages';
import {H6El} from '../../dom/H6El';
import {Action} from '../Action';
import {BodyMask} from '../mask/BodyMask';
import {Body} from '../../dom/Body';
import {ModalDialog, ModalDialogConfig} from './ModalDialog';

export class ConfirmationDialog
    extends ModalDialog {

    private questionEl: H6El;
    private yesCallback: () => void;
    private noCallback: () => void;

    private yesAction: Action;
    private noAction: Action;

    constructor(config: ModalDialogConfig = {}) {
        super({
            title: config.title || i18n('dialog.confirm.title'),
            closeIconCallback: config.closeIconCallback || (() => this.close()),
            class: 'confirmation-dialog'
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChildToContentPanel(this.questionEl);

            return rendered;
        });
    }

    setQuestion(question: string): ConfirmationDialog {
        this.questionEl.getEl().setInnerHtml(question);
        return this;
    }

    setYesCallback(callback: () => void): ConfirmationDialog {
        this.yesCallback = callback;
        return this;
    }

    setNoCallback(callback: () => void): ConfirmationDialog {
        this.noCallback = callback;
        return this;
    }

    open() {
        BodyMask.get().addClass('confirmation-dialog-mask');
        Body.get().appendChild(this);
        super.open();

        this.dialogContainer.addClass('confirmation-dialog-container');
    }

    close() {
        super.close();
        BodyMask.get().removeClass('confirmation-dialog-mask');
        this.remove();
    }

    protected initElements() {
        super.initElements();

        this.questionEl = new H6El('question');

        this.noAction = new Action(i18n('action.no'), i18n('action.no').slice(0, 1).toLowerCase());
        this.noAction.setMnemonic(i18n('action.no').slice(0, 1).toLowerCase());

        this.yesAction = new Action(i18n('action.yes'), i18n('action.yes').slice(0, 1).toLowerCase());
        this.yesAction.setMnemonic(i18n('action.yes').slice(0, 1).toLowerCase());

        this.addAction(this.yesAction, true);
        this.addAction(this.noAction);
    }

    protected initListeners() {
        super.initListeners();

        this.noAction.onExecuted(() => {
            this.close();

            if (this.noCallback) {
                this.noCallback();
            }
        });

        this.yesAction.onExecuted(() => {
            this.close();

            if (this.yesCallback) {
                this.yesCallback();
            }
        });
    }
}
