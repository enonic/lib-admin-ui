import {Element} from '../../dom/Element';
import {Body} from '../../dom/Body';
import {ModalDialog, ModalDialogConfig} from './ModalDialog';
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
    keepOpenOnClickOutside?: boolean;
}

export class ModalDialogWithConfirmation
    extends ModalDialog {

    protected confirmationDialog: ConfirmationDialog;

    private listOfClickIgnoredElements: Element[];

    constructor(config: ModalDialogWithConfirmationConfig) {
        super(config);
    }

    protected initElements() {
        super.initElements();
        this.listOfClickIgnoredElements = [];
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
        return <ModalDialogWithConfirmationConfig>this.config;
    }

    protected initListeners() {
        super.initListeners();

        this.initConfirmationDialogListeners();
    }

    private initConfirmationDialogListeners() {
        if (!this.getConfig().keepOpenOnClickOutside) {
            const mouseClickListener: (event: MouseEvent) => void = (event: MouseEvent) => {
                const noConfirmationDialog = !this.confirmationDialog || !this.confirmationDialog.isVisible();
                if (this.isActive() && noConfirmationDialog) {
                    for (let element = event.target; element; element = (<any>element).parentNode) {
                        if (element === this.getHTMLElement() || this.isIgnoredElementClicked(<any>element)) {
                            return;
                        }
                    }
                    this.confirmBeforeClose();
                }
            };

            this.onRemoved(() => {
                Body.get().unMouseDown(mouseClickListener);
            });

            this.onAdded(() => {
                Body.get().onMouseDown(mouseClickListener);
            });
        }
    }

    confirmBeforeClose() {
        if (this.confirmationDialog && this.isDirty()) {
            this.confirmationDialog.open();
            this.addClass('await-confirmation');
        } else {
            this.close();
        }
    }

    private isIgnoredElementClicked(element: HTMLElement): boolean {
        let ignoredElementClicked = false;
        if (element && element.className && element.className.indexOf) {
            ignoredElementClicked =
                element.className.indexOf('mce-') > -1 || element.className.indexOf('html-area-modal-dialog') > -1 ||
                element.className.indexOf('cke_') > -1;
        }
        ignoredElementClicked = ignoredElementClicked || this.listOfClickIgnoredElements.some((elem: Element) => {
            return elem.getHTMLElement() === element || elem.getEl().contains(element);
        });

        return ignoredElementClicked;
    }

    protected isActive() {
        return super.isVisible() && !this.isMasked();
    }

    protected hasSubDialog(): boolean {
        return this.confirmationDialog && this.confirmationDialog.isVisible();
    }

    protected isSingleDialogGroup(): boolean {
        return super.isSingleDialogGroup() ||
               (ModalDialog.getOpenDialogsCounter() === 2 && !!this.confirmationDialog && !!this.confirmationDialog.isVisible());
    }

    addClickIgnoredElement(elem: Element) {
        this.listOfClickIgnoredElements.push(elem);
    }

    removeClickIgnoredElement(elem: Element) {
        const elementIndex = this.listOfClickIgnoredElements.indexOf(elem);
        if (elementIndex > -1) {
            this.listOfClickIgnoredElements.splice(elementIndex, 1);
        }
    }
}
