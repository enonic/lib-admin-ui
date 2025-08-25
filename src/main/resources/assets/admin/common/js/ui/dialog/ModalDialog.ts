import * as Q from 'q';
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
    alwaysFullscreen?: boolean;
    allowFullscreen?: boolean;
}

export enum DialogState {
    OPEN, CLOSED
}

export abstract class ModalDialog
    extends DivEl {

    private static THRESHOLD: number = 80; // Max allowed space above and below the dialog, accumulated (in pixels)

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

    private cancelButton: DialogButton;

    private tabbable: Element[];

    private listOfClickIgnoredElements: Element[];

    private onClosedListeners: (() => void)[] = [];

    private resizeListeners: (() => void)[] = [];

    private skipTabbable: boolean;

    private resizeObserver: any;

    private responsiveItem: ResponsiveItem;

    private pendingMasks: number = 0;

    protected constructor(config: ModalDialogConfig = {} as ModalDialogConfig) {
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
        this.loadMask = new LoadMask(this.body);
        this.state = DialogState.CLOSED;
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
        // Nothing here
    }

    protected initListeners() {
        this.responsiveItem = new ResponsiveItem(this);
        this.initFocusInOutEventsHandlers();

        if (this.config.allowFullscreen !== false && this.config.alwaysFullscreen !== true) {
            this.initResizeHandler();
        }

        this.onRendered(() => {
            if (this.config.alwaysFullscreen) {
                this.addClass('always-fullscreen');
                this.toggleFullscreen(true);
            }
        });

        const closeIconCallback: () => void = this.config.closeIconCallback || (() => {
            if (this.cancelAction) {
                this.cancelAction.execute();
            } else {
                this.close();
            }
        });

        this.closeIcon.onClicked(closeIconCallback);

        const descendantsAddedHandler = AppHelper.debounce(() => {
            this.updateTabbable();
        }, 200);

        this.onDescendantAdded(descendantsAddedHandler);

        this.initClickOutsideListeners();
    }

    private initClickOutsideListeners() {
        if (!this.getConfig().keepOpenOnClickOutside) {
            const mouseClickListener: (event: MouseEvent) => void = (event: MouseEvent) => {
                if (this.canHandleOutsideClick()) {
                    for (let element = event.target; element; element = (element as any).parentNode) {
                        if (element === this.getHTMLElement() || this.isIgnoredElementClicked(element as any)) {
                            return;
                        }
                    }
                    this.handleClickOutside();
                    event.stopPropagation();
                    event.preventDefault();
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
                element.className.indexOf('mce-') > -1 ||
                element.className.indexOf('html-area-modal-dialog') > -1 ||
                element.className.indexOf('cke_') > -1 ||
                element.className.indexOf('confirmation-mask') > -1;
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
        const focusOutTimeout: number = 10;

        AppHelper.focusInOut(this, (lastFocused: HTMLElement) => {
            if (this.isFocusOutEventToBeProcessed(lastFocused)) {
                this.bringFocusBackToDialog(lastFocused);
            }
        }, focusOutTimeout, false);
    }

    protected isFocusOutEventToBeProcessed(lastFocused: HTMLElement): boolean {
        return this.isOpen() &&
            this.hasTabbable() &&
            !this.hasSubDialog() &&
            !this.isMasked() &&
            !this.isIframeWithinDialogHavingFocus() &&
            !this.isValidFocusedElement();
    }

    // html editor might have gotten focus
    private isIframeWithinDialogHavingFocus(): boolean {
        return this.isIframeFocused() && this.hasModalDialogAsParent(document.activeElement as HTMLElement);
    }

    private isIframeFocused(): boolean {
        return document.activeElement?.tagName.toLowerCase() === 'iframe';
    }

    private hasModalDialogAsParent(el: HTMLElement): boolean {
        const thisHtmlEl: HTMLElement = this.getHTMLElement();
        let parentEl: HTMLElement = el.parentElement;

        while (parentEl) {
            if (parentEl === thisHtmlEl) {
                return true;
            }

            parentEl = parentEl.parentElement;
        }

        return false;
    }

    private isValidFocusedElement(): boolean {
        return this.isIframeFocused() && document.activeElement?.className?.indexOf('cke_') > -1;
    }

    private bringFocusBackToDialog(lastFocused: HTMLElement): void {
        const lastTabbable: Element = this.getLastTabbable();

        if (!lastTabbable) {
            this.updateTabbable();
            this.focusFirstTabbable();
        } else if (lastFocused === lastTabbable.getHTMLElement()) { // last element lost focus
            this.focusFirstTabbable();
        } else {
            lastTabbable.giveFocus();
        }
    }

    private getLastTabbable(): Element {
        return this.tabbable.slice().reverse().find((el: Element) => el.isVisible() && !el.getEl().isDisabled());
    }

    private hasTabbable(): boolean {
        return !!this.tabbable && this.tabbable.length > 0;
    }

    protected hasSubDialog(): boolean {
        return false;
    }

    protected focusFirstTabbable(): boolean {
        return this.tabbable?.some((el: Element) => {
            return el.giveFocus();
        });
    }

    private createResizeObserver() {
        if (window['ResizeObserver']) {
            this.resizeObserver = new window['ResizeObserver'](() => {
                this.executeResizeHandlers();
            });
        }
    }

    private initResizeHandler() {
        this.handleResize = AppHelper.debounce(() => {
            if (this.isOpen()) {
                this.resizeHandler();
            }
        }, 200);
        ResponsiveManager.onAvailableSizeChanged(Body.get(), this.handleResize);

        this.createResizeObserver();
    }

    protected resizeHandler() {
        this.adjustHeight();
        this.responsiveItem.update();
    }

    private getDialogHeight(): number {
        const headerHeight = this.header.getEl().getHeight();
        const bodyHeight = this.body.getEl().getHeight();
        const footerHeight = this.footer.getEl().getHeight();

        return headerHeight + bodyHeight + footerHeight + ModalDialog.THRESHOLD;
    }

    private adjustHeight() {
        const dialogHeight = this.getEl().getHeightWithBorder();
        const containerHeight = BodyMask.get().getEl().getHeight() || Body.get().getEl().getHeight();
        if (containerHeight === 0 || dialogHeight === 0) {
            return;
        }

        const calculatedDialogHeight = this.getDialogHeight();
        this.toggleFullscreen(calculatedDialogHeight >= containerHeight);
    }

    protected toggleFullscreen(value: boolean) {
        if (value && this.config.allowFullscreen === false) {
            return;
        }
        if (!value && this.config.alwaysFullscreen === true) {
            return;
        }

        this.toggleClass('fullscreen', value);
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
        Body.get().reapplyFocus();
    }

    hide() {
        this.unResize(this.handleResize);

        if (this.isSingleDialogGroup()) {
            this.unBlurBackground();
        }
        super.hide(true);

        this.toggleFullscreen(false);
        if (this.dialogContainer.getParentElement()) {
            Body.get().removeChild(this.dialogContainer);
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            if (this.config.class) {
                this.addClass(this.config.class);
            }
            this.body.appendChild(this.contentPanel);
            this.footer.appendChild(this.buttonRow);

            const wrapper = new DivEl('modal-dialog-wrapper');
            wrapper.appendChildren<Element>(this.closeIcon, this.header, this.body, this.footer);
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

    setHeading(value: string) {
        this.header.setHeading(value);
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
        Body.get().getFocusedElement()?.giveBlur();
        BodyMask.get().show();
        KeyBindings.get().shelveBindings();

        this.show();

        const keyBindings: KeyBinding[] = Action.getKeyBindings(this.buttonRow.getActions()).concat(this.addKeyBindings());
        KeyBindings.get().bindKeys(keyBindings);

        this.state = DialogState.OPEN;
        DialogManagerInner.get().handleOpenDialog(this);
    }

    protected addKeyBindings(): KeyBinding[] {
        return []; // Can be overridden in subclasses
    }

    show() {
        if (!this.dialogContainer.hasChild(this)) {
            this.dialogContainer.appendChild(this);
        }
        Body.get().appendChild(this.dialogContainer);

        this.blurBackground();

        super.show();

        this.whenRendered(() => {
            this.updateTabbable();
            if (!this.elementToFocusOnShow?.giveFocus()) {
                if (!this.focusFirstTabbable()) {
                    this.buttonRow.focusDefaultAction();
                }
            }
        });

        if (this.resizeObserver) {
            this.resizeObserver.observe(this.body.getHTMLElement());
        }
        this.onResize(this.handleResize);
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

    unClosed(listener: () => void) {
        this.onClosedListeners = this.onClosedListeners.filter(function (curr: () => void) {
            return curr !== listener;
        });
    }

    private onResize(listener: () => void) {
        this.resizeListeners.push(listener);
    }

    private unResize(listener: () => void) {
        this.resizeListeners = this.resizeListeners.filter((curr) => {
            return curr !== listener;
        });
        if (this.resizeListeners.length === 0 && this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }

    public notifyResize() {
        if (this.resizeObserver) {
            // Resize observer will call executeResizeHandlers() directly
            return;
        }
        this.executeResizeHandlers();
    }

    private executeResizeHandlers() {
        this.resizeListeners.forEach((listener) => {
            listener();
        });
    }

    public setElementToFocusOnShow(element: Element) {
        this.elementToFocusOnShow = element;
    }

    protected showLoadMask() {
        this.pendingMasks++;
        this.whenRendered(() => {
            if (this.pendingMasks === 0) {
                // If hideLoadMask() was called before rendering is finished, don't show the mask
                return;
            }
            this.loadMask.show();
        });
    }

    protected hideLoadMask() {
        if (this.pendingMasks === 0) {
            return;
        }

        this.pendingMasks--;
        this.loadMask.hide();
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

    setHeading(value: string, escapeHtml?: boolean);

    getHeading(): string;

}

export class DefaultModalDialogHeader
    extends DivEl
    implements ModalDialogHeader {

    private readonly titleEl: H2El;

    constructor(title: string) {
        super('modal-dialog-header');

        this.titleEl = new H2El('title');
        this.setHeading(title);
        this.appendChild(this.titleEl);
    }

    setHeading(value: string) {
        this.titleEl.setHtml(value);
    }

    getHeading(): string {
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

    focusDefaultAction(): boolean {
        return this.defaultElement?.giveFocus();
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

    private dialogOpenListeners: ((dialog: ModalDialog) => void) [];

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
