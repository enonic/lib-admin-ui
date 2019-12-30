import * as Q from 'q';
import * as $ from 'jquery';
import {DivEl} from '../../dom/DivEl';
import {Action} from '../Action';
import {Element} from '../../dom/Element';
import {ResponsiveManager} from '../responsive/ResponsiveManager';
import {Body} from '../../dom/Body';
import {ResponsiveItem} from '../responsive/ResponsiveItem';
import {i18n} from '../../util/Messages';
import {LoadMask} from '../mask/LoadMask';
import {StyleHelper} from '../../StyleHelper';
import {AppHelper} from '../../util/AppHelper';
import {BodyMask} from '../mask/BodyMask';
import {KeyBindings} from '../KeyBindings';
import {H2El} from '../../dom/H2El';
import {DialogButton} from './DialogButton';
import {KeyBinding} from '../KeyBinding';
import {Store} from '../../store/Store';

export interface ModalDialogConfig {
    title?: string;
    buttonRow?: ButtonRow;
    closeIconCallback?: () => void;
    skipTabbable?: boolean;
    class?: string;
    keepOpenOnClickOutside?: boolean;
}

export enum DialogState {
    OPEN, CLOSED
}

export abstract class ModalDialog
    extends DivEl {

    public static debug: boolean = false;

    protected header: ModalDialogHeader;

    protected dialogContainer: DivEl;

    protected closeIcon: DivEl;

    protected loadMask: LoadMask;

    protected handleResize: () => void;

    protected config: ModalDialogConfig;

    private body: DivEl;

    private footer: DivEl;

    private state: DialogState;

    private contentPanel: ModalDialogContentPanel;

    private buttonRow: ButtonRow;

    private cancelAction: Action;

    private elementToFocusOnShow: Element;

    private renderedListenerForLoadMask: () => void;

    private shownListenerForLoadMask: () => void;

    private cancelButton: DialogButton;

    private tabbable: Element[];

    private listOfClickIgnoredElements: Element[];

    private onClosedListeners: { (): void; }[] = [];

    private resizeListeners: { (): void; }[] = [];

    private skipTabbable: boolean;

    private resizeObserver: any;

    private responsiveItem: ResponsiveItem;

    protected constructor(config: ModalDialogConfig = <ModalDialogConfig>{}) {
        super('modal-dialog', StyleHelper.COMMON_PREFIX);
        this.config = config;

        this.initElements();
        this.postInitElements();
        this.initListeners();
    }

    protected initElements() {
        this.buttonRow = this.config.buttonRow || new ButtonRow();
        this.dialogContainer = new DivEl('dialog-container');
        this.skipTabbable = this.config.skipTabbable || false;
        this.cancelAction = this.createDefaultCancelAction();
        this.closeIcon = new DivEl('cancel-button-top');
        this.header = this.createHeader(this.config.title || '');
        this.contentPanel = new ModalDialogContentPanel();
        this.body = new DivEl('modal-dialog-body');
        this.footer = new DivEl('modal-dialog-footer');
        this.loadMask = new LoadMask(this.contentPanel);
        this.state = DialogState.CLOSED;
        this.renderedListenerForLoadMask = () => {
            this.loadMask.show();
            this.unRendered(this.renderedListenerForLoadMask);
        };
        this.shownListenerForLoadMask = () => {
            this.loadMask.show();
            this.unShown(this.shownListenerForLoadMask);
        };
        this.listOfClickIgnoredElements = [];
    }

    private createDefaultCancelAction() {
        const cancelAction = new Action(i18n('action.cancel'), 'esc', true);
        cancelAction.setIconClass('cancel-button-top');
        cancelAction.setLabel('');
        cancelAction.onExecuted(() => {
            this.close();
        });
        this.buttonRow.addToActions(cancelAction);
        return cancelAction;
    }

    protected createHeader(title: string): ModalDialogHeader {
        return new DefaultModalDialogHeader(title);
    }

    protected postInitElements() {
        this.loadMask.setRemoveWhenMaskedRemoved(false);
    }

    protected initListeners() {
        this.responsiveItem = new ResponsiveItem(this);
        this.initFocusInOutEventsHandlers();

        this.initResizeHandler();

        this.onRendered(() => {
            if (!this.skipTabbable) {
                this.updateTabbable();
            }

            if (this.elementToFocusOnShow) {
                this.elementToFocusOnShow.giveFocus();
            } else {
                this.buttonRow.focusDefaultAction();
            }
        });

        const closeIconCallback = this.config.closeIconCallback || (() => {
            if (this.cancelAction) {
                this.cancelAction.execute();
            } else {
                this.close();
            }
        });

        this.closeIcon.onClicked(closeIconCallback);

        this.initClickOutsideListeners();
    }

    private initClickOutsideListeners() {
        if (!this.getConfig().keepOpenOnClickOutside) {
            const mouseClickListener: (event: MouseEvent) => void = (event: MouseEvent) => {
                if (this.canHandleOutsideClick()) {
                    for (let element = event.target; element; element = (<any>element).parentNode) {
                        if (element === this.getHTMLElement() || this.isIgnoredElementClicked(<any>element)) {
                            return;
                        }
                    }
                    this.handleClickOutside();
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

    protected isIgnoredElementClicked(element: HTMLElement): boolean {
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

    protected canHandleOutsideClick(): boolean {
        return this.isActive();
    }

    protected handleClickOutside() {
        this.close();
    }

    getConfig(): ModalDialogConfig {
        return this.config;
    }

    protected isActive() {
        return this.isOpen() && !this.isMasked();
    }

    isMasked(): boolean {
        return this.hasClass('masked');
    }

    private initFocusInOutEventsHandlers() {
        let buttonRowIsFocused: boolean = false;
        let buttonRowFocusOutTimeout: number;
        const focusOutTimeout: number = 10;

        this.onMouseDown(() => {
            buttonRowIsFocused = false; // making dialog focusOut event give focus to last tabbable elem
        });

        AppHelper.focusInOut(this, () => {
            if (this.hasTabbable() && !this.hasSubDialog() && !this.isMasked()) {
                // last focusable - Cancel
                // first focusable - X
                if (buttonRowIsFocused) { // last element lost focus
                    this.tabbable[0].giveFocus();
                } else {
                    this.tabbable[this.tabbable.length - 1].giveFocus();
                }
            }
        }, focusOutTimeout, false);

        this.buttonRow.onFocusIn(() => {
            buttonRowIsFocused = true;
            clearTimeout(buttonRowFocusOutTimeout);
        });

        this.buttonRow.onFocusOut(() => {
            buttonRowFocusOutTimeout = <any>setTimeout(() => {
                buttonRowIsFocused = false;
            }, focusOutTimeout + 5); // timeout should be > timeout for modal dialog to trigger after
        });
    }

    private hasTabbable(): boolean {
        return !!this.tabbable && this.tabbable.length > 0;
    }

    protected hasSubDialog(): boolean {
        return false;
    }

    private initResizeHandler() {
        this.handleResize = AppHelper.runOnceAndDebounce(() => {
            if (this.isOpen()) {
                this.body.removeClass('non-scrollable');
                this.resizeHandler();
            }
        }, 50);
        ResponsiveManager.onAvailableSizeChanged(Body.get(), () => {
            this.handleResize();
        });

        if (window['ResizeObserver']) {
            this.resizeObserver = new window['ResizeObserver'](() => {
                this.handleResize();
            });
        }
    }

    protected resizeHandler() {
        this.adjustHeight();
        this.adjustOverflow();
        this.responsiveItem.update();
    }

    private adjustHeight() {
        const dialogHeight = this.getEl().getHeightWithBorder();

        if (dialogHeight === 0 || dialogHeight % 2 === 0) {

            return;
        }

        const borderBottom = parseFloat($(this.getHTMLElement()).css('border-bottom'));
        const dialogHeightWithoutBorder = borderBottom ? dialogHeight - borderBottom : dialogHeight;

        if (dialogHeightWithoutBorder % 2 === 0 && borderBottom) {
            $(this.getHTMLElement()).css('border-bottom-width', '0px');

            return;
        }
        let borderHeight = 1;
        if (dialogHeightWithoutBorder % 1 !== 0) {
            borderHeight = Math.ceil(dialogHeightWithoutBorder) - dialogHeightWithoutBorder;
            if (Math.ceil(dialogHeightWithoutBorder) % 2 === 1) {
                borderHeight++;
            }
        }

        $(this.getHTMLElement()).css('border-bottom', `${borderHeight}px solid transparent`);
    }

    private adjustOverflow() {

        const bodyHeight = this.body.getEl().getHeight();
        if (bodyHeight === 0) {
            return;
        }
        const maxBodyHeight = this.body.getEl().getMaxHeight();
        const showScrollbar = Math.floor(bodyHeight) >= Math.floor(maxBodyHeight);

        this.body.toggleClass('non-scrollable', !showScrollbar);
    }

    protected getBody(): DivEl {
        return this.body;
    }

    protected updateTabbable() {
        this.tabbable = this.getTabbableElements();
    }

    isDirty(): boolean {
        return false;
    }

    protected isSingleDialogGroup(): boolean {
        return DialogManagerInner.get().getTotalOpen() === 1;
    }

    protected isBlurredBackgroundNeeded(): boolean {
        return true;
    }

    close() {
        if (this.isSingleDialogGroup()) {
            BodyMask.get().hide();
        }

        this.hide();

        KeyBindings.get().unshelveBindings();
        this.state = DialogState.CLOSED;
        DialogManagerInner.get().handleClosedDialog(this);

        this.notifyClosed();
    }

    hide() {
        if (this.resizeObserver) {
            this.resizeObserver.unobserve(this.body.getHTMLElement());
        }
        this.unResize(this.handleResize);

        if (this.isSingleDialogGroup()) {
            this.unBlurBackground();
        }
        super.hide(true);

        if (this.dialogContainer.getParentElement()) {
            Body.get().removeChild(this.dialogContainer);
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            if (this.config.class) {
                this.addClass(this.config.class);
            }
            this.appendChild(this.closeIcon);
            this.body.appendChild(this.contentPanel);
            this.footer.appendChild(this.buttonRow);

            const wrapper = new DivEl('modal-dialog-wrapper');
            wrapper.appendChildren<Element>(this.header, this.body, this.footer);
            this.appendChild(wrapper);

            this.appendChildToContentPanel(this.loadMask);

            return rendered;
        });
    }

    onCloseButtonClicked(listener: (e: MouseEvent) => void) {
        return this.closeIcon.onClicked(listener);
    }

    unCloseButtonClicked(listener: (e: MouseEvent) => void) {
        return this.closeIcon.unClicked(listener);
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

    mask() {
        this.addClass('masked');
    }

    unmask() {
        this.removeClass('masked');
    }

    getCancelAction(): Action {
        return this.cancelAction;
    }

    getCancelButton(): DialogButton {
        return this.cancelButton;
    }

    addCancelButtonToBottom(buttonLabel?: string, useDefault?: boolean): DialogButton {
        const cancelAction = new Action(buttonLabel || i18n('action.cancel'));
        cancelAction.setIconClass('cancel-button-bottom force-enabled');
        cancelAction.onExecuted(() => this.cancelAction.execute());

        this.cancelButton = this.buttonRow.addAction(cancelAction, useDefault);
        this.cancelButton.getEl().setAttribute('data-button-text', i18n('action.ok'));
        return this.cancelButton;
    }

    setTitle(value: string, escapeHtml: boolean = true) {
        this.header.setTitle(value, escapeHtml);
    }

    appendChildToContentPanel(child: Element) {
        this.contentPanel.appendChild(child);
    }

    prependChildToContentPanel(child: Element) {
        this.contentPanel.prependChild(child);
    }

    appendChildToHeader(child: Element) {
        this.header.appendChild(child);
    }

    prependChildToHeader(child: Element) {
        this.header.prependChild(child);
    }

    appendChildToFooter(child: Element) {
        this.footer.appendChild(child);
    }

    prependChildToFooter(child: Element) {
        this.footer.prependChild(child);
    }

    removeChildFromContentPanel(child: Element) {
        this.contentPanel.removeChild(child);
    }

    addAction(action: Action, useDefault?: boolean, prepend?: boolean): DialogButton {
        return this.buttonRow.addAction(action, useDefault, prepend);
    }

    removeAction(actionButton: DialogButton) {
        if (!actionButton) {
            return;
        }

        const action = actionButton.getAction();

        this.buttonRow.removeAction(action);
    }

    open() {

        BodyMask.get().show();

        KeyBindings.get().shelveBindings();

        this.show();

        this.handleResize();

        let keyBindings = Action.getKeyBindings(this.buttonRow.getActions());

        if (!this.skipTabbable) {
            this.updateTabbable();
        }

        keyBindings = keyBindings.concat([
            new KeyBinding('right', (event) => {
                this.focusNextTabbable();

                event.stopPropagation();
                event.preventDefault();
            }),
            new KeyBinding('left', (event) => {
                this.focusPreviousTabbable();

                event.stopPropagation();
                event.preventDefault();
            })
        ]);

        KeyBindings.get().bindKeys(keyBindings);

        this.state = DialogState.OPEN;
        DialogManagerInner.get().handleOpenDialog(this);
    }

    show() {
        if (!this.dialogContainer.hasChild(this)) {
            this.dialogContainer.appendChild(this);
        }
        Body.get().appendChild(this.dialogContainer);
        this.responsiveItem.update();

        this.blurBackground();

        super.show();

        if (this.isRendered()) {
            if (this.elementToFocusOnShow) {
                this.elementToFocusOnShow.giveFocus();
            } else {
                this.buttonRow.focusDefaultAction();
            }
        }
        if (this.resizeObserver) {
            this.resizeObserver.observe(this.body.getHTMLElement());
        }
        this.onResize(this.handleResize);

        $(this.body.getHTMLElement()).css('height', '');
    }

    getButtonRow(): ButtonRow {
        return this.buttonRow;
    }

    getContentPanel(): ModalDialogContentPanel {
        return this.contentPanel;
    }

    onClosed(onCloseCallback: () => void) {
        this.onClosedListeners.push(onCloseCallback);
    }

    unClosed(listener: { (): void; }) {
        this.onClosedListeners = this.onClosedListeners.filter(function (curr: { (): void; }) {
            return curr !== listener;
        });
    }

    onResize(listener: () => void) {
        this.resizeListeners.push(listener);
    }

    unResize(listener: () => void) {
        this.resizeListeners = this.resizeListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    public notifyResize() {
        this.resizeListeners.forEach((listener) => {
            listener();
        });
    }

    public setElementToFocusOnShow(element: Element) {
        this.elementToFocusOnShow = element;
    }

    protected showLoadMask() {
        if (this.isOpen()) {
            this.loadMask.show();
        } else {
            if (this.isRendered()) {
                this.onShown(this.shownListenerForLoadMask);
            } else {
                this.onRendered(this.renderedListenerForLoadMask);
            }
        }

}

    protected hideLoadMask() {
        this.loadMask.hide();
        this.unRendered(this.renderedListenerForLoadMask);
        this.unShown(this.shownListenerForLoadMask);
    }

    isOpen(): boolean {
        return this.state === DialogState.OPEN;
    }

    isClosed(): boolean {
        return this.state === DialogState.CLOSED;
    }

    private notifyClosed() {
        this.onClosedListeners.forEach((listener) => {
            listener();
        });
    }

    private unBlurBackground() {
        Body.get().getHTMLElement().classList.remove('blurred');
    }

    private blurBackground() {
        if (this.isBlurredBackgroundNeeded()) {
            Body.get().getHTMLElement().classList.add('blurred');
        }
    }

    private focusNextTabbable() {
        if (this.hasTabbable()) {
            let tabbedIndex = this.getTabbedIndex();
            tabbedIndex = tabbedIndex + 1 >= this.tabbable.length ? 0 : tabbedIndex + 1;
            this.tabbable[tabbedIndex].giveFocus();
        }
    }

    private focusPreviousTabbable() {
        if (this.hasTabbable()) {
            let tabbedIndex = this.getTabbedIndex();
            tabbedIndex = tabbedIndex - 1 < 0 ? this.tabbable.length - 1 : tabbedIndex - 1;
            this.tabbable[tabbedIndex].giveFocus();
        }
    }

    private getTabbedIndex(): number {
        let activeElement = document.activeElement;
        let tabbedIndex = 0;
        if (this.hasTabbable()) {
            for (let i = 0; i < this.tabbable.length; i++) {
                if (activeElement === this.tabbable[i].getHTMLElement()) {
                    tabbedIndex = i;
                    break;
                }
            }
        }
        return tabbedIndex;
    }
}

export interface ModalDialogHeader
    extends Element {

    setTitle(value: string, escapeHtml?: boolean);

    getTitle(): string;

}

export class DefaultModalDialogHeader
    extends DivEl
    implements ModalDialogHeader {

    private titleEl: H2El;

    constructor(title: string) {
        super('modal-dialog-header');

        this.titleEl = new H2El('title');
        this.titleEl.setHtml(title);
        this.appendChild(this.titleEl);
    }

    setTitle(value: string, escapeHtml: boolean = true) {
        this.titleEl.setHtml(value, escapeHtml);
    }

    getTitle(): string {
        return this.titleEl.getHtml();
    }
}

export class ModalDialogContentPanel
    extends DivEl {

    constructor() {
        super('dialog-content');
    }
}

export class ButtonRow
    extends DivEl {

    private defaultElement: Element;

    private buttonContainer: DivEl;

    private actions: Action[] = [];

    constructor() {
        super('dialog-buttons');

        this.buttonContainer = new DivEl('button-container');
        this.appendChild(this.buttonContainer);
    }

    addElement(element: Element, prepend?: boolean) {
        if (prepend) {
            this.buttonContainer.prependChild(element);
        } else {
            this.buttonContainer.appendChild(element);
        }
    }

    getActions(): Action[] {
        return this.actions;
    }

    addToActions(action: Action) {
        this.actions.push(action);
    }

    addAction(action: Action, useDefault?: boolean, prepend?: boolean): DialogButton {
        const button = new DialogButton(action);
        if (useDefault) {
            this.setDefaultElement(button);
        }

        this.addElement(button, prepend);

        action.onPropertyChanged(() => {
            button.setLabel(action.getLabel());
            button.setEnabled(action.isEnabled());
        });

        this.actions.push(action);

        return button;
    }

    removeAction(action: Action) {
        const index = this.actions.indexOf(action);
        if (index >= 0) {
            this.actions.splice(index, 1);
        }

        this.buttonContainer.getChildren()
            .filter((button: DialogButton) => button.getAction() === action)
            .forEach((button: DialogButton) => {
                if (this.defaultElement === button) {
                    this.resetDefaultElement();
                }
                this.buttonContainer.removeChild(button);
            });
    }

    setDefaultElement(element: Element) {
        this.defaultElement = element;
    }

    resetDefaultElement() {
        this.defaultElement = null;
    }

    focusDefaultAction() {
        if (this.defaultElement) {
            this.defaultElement.giveFocus();
        }
    }
}

export function applyMixins(derivedCtor: any, baseCtors: any[]) {
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            if (!derivedCtor.prototype[name]) {
                derivedCtor.prototype[name] = baseCtor.prototype[name];
            }
        });
    });
}

const DIALOG_MANAGER_KEY: string = 'DialogManagerInner';

class DialogManagerInner {

    private openDialogs: ModalDialog[];

    private maskedBy: Map<string, ModalDialog[]>;

    private dialogOpenListeners: { (dialog: ModalDialog): void; } [];

    private constructor() {
        this.openDialogs = [];
        this.dialogOpenListeners = [];
        this.maskedBy = new Map();
    }

    static get(): DialogManagerInner {
        let instance: DialogManagerInner = Store.instance().get(DIALOG_MANAGER_KEY);

        if (instance == null) {
            instance = new DialogManagerInner();
            Store.instance().set(DIALOG_MANAGER_KEY, instance);
        }

        return instance;
    }

    handleOpenDialog(dialog: ModalDialog) {
        if (this.isOpen(dialog)) {
            return;
        }

        const dialogId: string = dialog.getId();
        const dialogsToMask: ModalDialog[] = [];
        this.maskedBy.set(dialogId, dialogsToMask);

        this.openDialogs.filter((openDialog: ModalDialog) => !openDialog.isMasked()).forEach((notMaskedDialog: ModalDialog) => {
            dialogsToMask.push(notMaskedDialog);
            notMaskedDialog.mask();
        });

        this.openDialogs.push(dialog);
        this.notifyDialogOpen(dialog);
    }

    handleClosedDialog(dialog: ModalDialog) {
        if (!this.isOpen(dialog)) {
            return;
        }

        this.openDialogs = this.openDialogs.filter((openDialog) => {
            return openDialog !== dialog;
        });

        const dialogId: string = dialog.getId();
        this.maskedBy.get(dialogId).forEach((maskedDialog: ModalDialog) => {
            maskedDialog.unmask();
        });

        this.maskedBy.delete(dialogId);
    }

    getTotalOpen(): number {
        return this.openDialogs.length;
    }

    onDialogOpen(listener: (dialog: ModalDialog) => void) {
        this.dialogOpenListeners.push(listener);
    }

    unDialogOpen(listener: (dialog: ModalDialog) => void) {
        this.dialogOpenListeners = this.dialogOpenListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private isOpen(dialog: ModalDialog): boolean {
        return this.openDialogs.some((openDialog: ModalDialog) => openDialog === dialog);
    }

    private notifyDialogOpen(dialog: ModalDialog) {
        this.dialogOpenListeners.forEach((listener) => {
            listener(dialog);
        });
    }
}

export class DialogManager {

    public static getTotalOpen(): number {
        return DialogManagerInner.get().getTotalOpen();
    }

    public static onDialogOpen(listener: (dialog: ModalDialog) => void) {
        DialogManagerInner.get().onDialogOpen(listener);
    }

    public static unDialogOpen(listener: (dialog: ModalDialog) => void) {
        DialogManagerInner.get().unDialogOpen(listener);
    }

}
