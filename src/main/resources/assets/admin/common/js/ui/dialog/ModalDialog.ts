module api.ui.dialog {

    import DivEl = api.dom.DivEl;
    import Action = api.ui.Action;
    import Element = api.dom.Element;
    import ResponsiveManager = api.ui.responsive.ResponsiveManager;
    import Body = api.dom.Body;
    import ResponsiveItem = api.ui.responsive.ResponsiveItem;
    import i18n = api.util.i18n;

    export interface ConfirmationConfig {
        question?: string;
        yesCallback: () => void;
        noCallback?: () => void;
    }

    export interface ModalDialogConfig {
        title?: string;
        buttonRow?: ButtonRow;
        confirmation?: ConfirmationConfig;
        closeIconCallback?: () => void;
        skipTabbable?: boolean;
        class?: string;
        keepOpenOnClickOutside?: boolean;
    }

    export enum DialogState {
        OPEN, CLOSED
    }

    export class ModalDialog
        extends DivEl {

        protected header: api.ui.dialog.ModalDialogHeader;

        protected dialogContainer: api.dom.DivEl;

        private body: api.dom.DivEl;

        private footer: api.dom.DivEl;

        private state: DialogState;

        private contentPanel: ModalDialogContentPanel;

        private buttonRow: ButtonRow;

        private cancelAction: Action;

        private elementToFocusOnShow: Element;

        protected closeIcon: DivEl;

        protected loadMask: api.ui.mask.LoadMask;

        private renderedListenerForLoadMask: () => void;

        private shownListenerForLoadMask: () => void;

        private cancelButton: DialogButton;

        protected confirmationDialog: ConfirmationDialog;

        private tabbable: Element[];

        private listOfClickIgnoredElements: Element[] = [];

        private onClosedListeners: { (): void; }[] = [];

        private resizeListeners: { (): void; }[] = [];

        protected handleResize: () => void;

        private skipTabbable: boolean;

        public static debug: boolean = false;

        private resizeObserver: any;

        private responsiveItem: ResponsiveItem;

        protected config: ModalDialogConfig;

        constructor(config: ModalDialogConfig = <ModalDialogConfig>{}) {
            super('modal-dialog', api.StyleHelper.COMMON_PREFIX);
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
            this.loadMask = new api.ui.mask.LoadMask(this.contentPanel);
            this.state = DialogState.CLOSED;
            this.renderedListenerForLoadMask = () => {
                this.loadMask.show();
                this.unRendered(this.renderedListenerForLoadMask);
            };
            this.shownListenerForLoadMask = () => {
                this.loadMask.show();
                this.unShown(this.shownListenerForLoadMask);
            };
            this.initConfirmationDialog();
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

        protected createHeader(title: string): api.ui.dialog.ModalDialogHeader {
            return new DefaultModalDialogHeader(title);
        }

        private initConfirmationDialog() {
            if (this.config.confirmation) {
                const {yesCallback, noCallback, question = i18n('dialog.confirm.applyChanges')} = this.config.confirmation;

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
        }

        protected postInitElements() {
            this.loadMask.setRemoveWhenMaskedRemoved(false);
        }

        protected initListeners() {
            this.responsiveItem = new ResponsiveItem(this);
            this.initClickOutsideDialogHandlers();
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
        }

        private initClickOutsideDialogHandlers() {
            if (this.config.keepOpenOnClickOutside) {
                return;
            }

            const clickOutsideCallback = (() => {
                this.confirmBeforeClose();
            });

            const mouseClickListener: (event: MouseEvent) => void = (event: MouseEvent) => {
                const noConfirmationDialog = !this.confirmationDialog || !this.confirmationDialog.isOpen();
                if (this.isActive() && noConfirmationDialog) {
                    for (let element = event.target; element; element = (<any>element).parentNode) {
                        if (element === this.getHTMLElement() || this.isIgnoredElementClicked(<any>element)) {
                            return;
                        }
                    }
                    clickOutsideCallback();
                }
            };

            this.onRemoved(() => {
                api.dom.Body.get().unMouseDown(mouseClickListener);
            });

            this.onAdded(() => {
                api.dom.Body.get().onMouseDown(mouseClickListener);
            });
        }

        private isActive() {
            return this.isOpen() && !this.isMasked();
        }

        isMasked(): boolean {
            return this.hasClass('masked');
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

        private initFocusInOutEventsHandlers() {
            let buttonRowIsFocused: boolean = false;
            let buttonRowFocusOutTimeout: number;
            const focusOutTimeout: number = 10;

            this.onMouseDown(() => {
                buttonRowIsFocused = false; // making dialog focusOut event give focus to last tabbable elem
            });

            api.util.AppHelper.focusInOut(this, () => {
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
                buttonRowFocusOutTimeout = setTimeout(() => {
                    buttonRowIsFocused = false;
                }, focusOutTimeout + 5); // timeout should be > timeout for modal dialog to trigger after
            });
        }

        private hasTabbable(): boolean {
            return !!this.tabbable && this.tabbable.length > 0;
        }

        protected hasSubDialog(): boolean {
            return this.confirmationDialog && this.confirmationDialog.isOpen();
        }

        private initResizeHandler() {
            this.handleResize = api.util.AppHelper.runOnceAndDebounce(() => {
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

            const borderBottom = parseFloat(wemjq(this.getHTMLElement()).css('border-bottom'));
            const dialogHeightWithoutBorder = borderBottom ? dialogHeight - borderBottom : dialogHeight;

            if (dialogHeightWithoutBorder % 2 === 0 && borderBottom) {
                wemjq(this.getHTMLElement()).css('border-bottom-width', '0px');

                return;
            }
            let borderHeight = 1;
            if (dialogHeightWithoutBorder % 1 !== 0) {
                borderHeight = Math.ceil(dialogHeightWithoutBorder) - dialogHeightWithoutBorder;
                if (Math.ceil(dialogHeightWithoutBorder) % 2 === 1) {
                    borderHeight++;
                }
            }

            wemjq(this.getHTMLElement()).css('border-bottom', `${borderHeight}px solid transparent`);
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

        protected getBody(): api.dom.DivEl {
            return this.body;
        }

        protected updateTabbable() {
            this.tabbable = this.getTabbableElements();
        }

        confirmBeforeClose() {
            if (this.confirmationDialog && this.isDirty()) {
                this.confirmationDialog.open();
                this.addClass('await-confirmation');
            } else {
                this.close();
            }
        }

        isDirty(): boolean {
            return false;
        }

        protected isSingleDialogGroup(): boolean {
            return DialogManagerInner.get().getTotalOpen() === 1 ||
                   (DialogManagerInner.get().getTotalOpen() === 2 && !!this.confirmationDialog &&
                    !!this.confirmationDialog.isOpen());
        }

        close() {
            if (this.isSingleDialogGroup()) {
                api.ui.mask.BodyMask.get().hide();
            }

            this.hide();

            api.ui.KeyBindings.get().unshelveBindings();
            this.state = DialogState.CLOSED;
            DialogManagerInner.get().closed(this);

            this.notifyClosed();
        }

        private notifyClosed() {
            this.onClosedListeners.forEach((listener) => {
                listener();
            });
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
                api.dom.Body.get().removeChild(this.dialogContainer);
            }
        }

        private unBlurBackground() {
            api.dom.Body.get().getHTMLElement().classList.remove('blurred');
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

        mask() {
            this.addClass('masked');
        }

        unmask() {
            this.removeClass('masked');
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

            api.ui.mask.BodyMask.get().show();

            api.ui.KeyBindings.get().shelveBindings();

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

            api.ui.KeyBindings.get().bindKeys(keyBindings);

            this.state = DialogState.OPEN;
            DialogManagerInner.get().opened(this);
        }

        show() {
            if (!this.dialogContainer.hasChild(this)) {
                this.dialogContainer.appendChild(this);
            }
            api.dom.Body.get().appendChild(this.dialogContainer);
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

            wemjq(this.body.getHTMLElement()).css('height', '');
        }

        private blurBackground() {
            if (this.isBlurredBackgroundNeeded()) {
                api.dom.Body.get().getHTMLElement().classList.add('blurred');
            }
        }

        protected isBlurredBackgroundNeeded(): boolean {
            return true;
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
    }

    export interface ModalDialogHeader
        extends api.dom.Element {

        setTitle(value: string, escapeHtml?: boolean);

        getTitle(): string;

    }

    export class DefaultModalDialogHeader
        extends DivEl
        implements ModalDialogHeader {

        private titleEl: api.dom.H2El;

        constructor(title: string) {
            super('modal-dialog-header');

            this.titleEl = new api.dom.H2El('title');
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

    class DialogManagerInner {

        private openDialogs: ModalDialog[];

        private dialogOpenListeners: { (dialog: ModalDialog): void; } [];

        private static INSTANCE: DialogManagerInner;

        private constructor() {
            this.openDialogs = [];
            this.dialogOpenListeners = [];
        }

        public static get(): DialogManagerInner {
            if (!DialogManagerInner.INSTANCE) {
                DialogManagerInner.INSTANCE = new DialogManagerInner();
            }

            return DialogManagerInner.INSTANCE;
        }

        opened(dialog: ModalDialog) {
            if (this.openDialogs.some((openDialog: ModalDialog) => openDialog === dialog)) {
                return;
            }

            this.openDialogs.push(dialog);
            this.notifyDialogOpen(dialog);
        }

        closed(dialog: ModalDialog) {
            this.openDialogs = this.openDialogs.filter((openDialog) => {
                return openDialog !== dialog;
            });
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

        private notifyDialogOpen(dialog: ModalDialog) {
            this.dialogOpenListeners.forEach((listener) => {
                listener(dialog);
            });
        }
    }

    export class DialogManager {

        private constructor() {
            throw new Error('Not supposed to be invoked');
        }

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

}
