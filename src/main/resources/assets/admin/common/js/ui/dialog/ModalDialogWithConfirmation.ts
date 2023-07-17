import {DialogManager, ModalDialog, ModalDialogConfig} from './ModalDialog';
import {ConfirmationDialog} from './ConfirmationDialog';
import {i18n} from '../../util/Messages';

export interface ConfirmationConfig {
    question?: string;
    yesCallback?: () => void;
    noCallback?: () => void;
}

export interface ModalDialogWithConfirmationConfig
    extends ModalDialogConfig {
    confirmation?: ConfirmationConfig;
}

export class ModalDialogWithConfirmation
    extends ModalDialog {

    protected confirmationDialog: ConfirmationDialog;

    constructor(config: ModalDialogWithConfirmationConfig) {
        super(config);
    }

    protected initElements() {
        super.initElements();
        this.initConfirmationDialog();
    }

    private initConfirmationDialog() {
        const {confirmation} = this.getConfig();
        const {yesCallback, noCallback, question = i18n('dialog.confirm.applyChanges')} = confirmation || {};

        this.confirmationDialog = new ConfirmationDialog()
            .setQuestion(question)
            .setYesCallback(yesCallback || (() => {
                this.close();
            }));
        if (noCallback) {
            this.confirmationDialog.setNoCallback(noCallback);
        }

        this.confirmationDialog.onClosed(() => this.removeClass('await-confirmation'));
    }

    getConfig(): ModalDialogWithConfirmationConfig {
        return this.config as ModalDialogWithConfirmationConfig;
    }

    protected canHandleOutsideClick(): boolean {
        const noConfirmationDialog = !this.confirmationDialog || !this.confirmationDialog.isOpen();
        return this.isActive() && noConfirmationDialog;
    }

    protected handleClickOutside() {
        if (this.confirmationDialog && this.isDirty()) {
            this.confirmationDialog.open();
            this.addClass('await-confirmation');
        } else {
            this.close();
        }
    }

    protected isActive() {
        return super.isVisible() && !this.isMasked();
    }

    protected hasSubDialog(): boolean {
        return this.confirmationDialog && this.confirmationDialog.isOpen();
    }

    protected isSingleDialogGroup(): boolean {
        return super.isSingleDialogGroup() ||
               (DialogManager.getTotalOpen() === 2 && !!this.confirmationDialog && !!this.confirmationDialog.isOpen());
    }
}
