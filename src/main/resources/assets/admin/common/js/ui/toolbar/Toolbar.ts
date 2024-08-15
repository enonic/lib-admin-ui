import {ActionButton} from '../button/ActionButton';
import {i18n} from '../../util/Messages';
import {DivEl} from '../../dom/DivEl';
import {ActionContainer} from '../ActionContainer';
import {Action} from '../Action';
import {ResponsiveManager} from '../responsive/ResponsiveManager';
import {Element} from '../../dom/Element';
import {FoldButton} from './FoldButton';
import {IWCAG as WCAG, AriaRole} from '../WCAG';
import {KeyHelper} from '../KeyHelper';
import {Body} from '../../dom/Body';

interface ActionElement {
    element: Element;
    action?: Action;
    folded?: boolean;
}

export interface ToolbarConfig {
    className?: string;
}

export class Toolbar<C extends ToolbarConfig>
    extends DivEl
    implements ActionContainer, WCAG {

    [WCAG]: boolean = true;
    ariaLabel: string = i18n('wcag.toolbar.label');
    role: AriaRole = AriaRole.TOOLBAR;
    tabbable: boolean = true;

    protected config: C;
    protected foldButton: FoldButton;
    protected actionElements: ActionElement[] = [];
    private locked: boolean;
    private hasGreedySpacer: boolean;
    private lastFocusedActionIndex = -1;
    private lastActionIndex= -1;

    private visibleButtonsWidth = 0;

    private mouseClickListener: (event: MouseEvent) => void;

    constructor(config?: C) {
        super(config?.className ?? undefined);

        this.addClass('toolbar');

        this.config = config;
        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        //
    }

    protected initListeners(): void {
        const onToolbarFocused = () => {
            this.focusToolbar();
            this.focusActionElement();
        };
        Body.get().onClicked((event) => {
            console.log(this.getEl(), event);
            const clickInsideToolbar = this.getEl().getHTMLElement().contains(event.target as Node);
            if (clickInsideToolbar) {
                if (this.isFocused()) {
                    return;
                }
                console.log('Toolbar.onClicked, focusing toolbar');
                onToolbarFocused();
            }
        });

        // Hack: Update after styles are applied to evaluate the sizes correctly
        ResponsiveManager.onAvailableSizeChanged(this, () => window.setTimeout(this.foldOrExpand.bind(this)));

        this.onFocus(() => {
            console.log('Toolbar.onFocus');
            onToolbarFocused();
        });
    }

    private getFocusedActionElement(): Element {
        if (this.lastFocusedActionIndex === -1) {
            return null;
        }

        const lastFocusedActionElement = this.actionElements[this.lastFocusedActionIndex];
        if (lastFocusedActionElement.folded) {
            return null;
        }

        return lastFocusedActionElement.element;
    }

    private focusToolbar() {
        if (this.isFocused()) {
            return;
        }

        this.mouseClickListener = (event: MouseEvent) => {
            if (!this.getEl().getHTMLElement().contains(event.target as Node)) {
                this.removeFocus();
            }
        };

        this.addClassEx('focused');
        Body.get().onMouseUp(this.mouseClickListener);
    }

    private removeFocus() {
        if (!this.isFocused()) {
            return;
        }
        this.getFocusedActionElement()?.giveBlur();
        this.removeClassEx('focused');
        Body.get().onMouseUp(this.mouseClickListener);
        this.mouseClickListener = null;
    }

    private isActionFocusable(actionElement: ActionElement): boolean {
        return actionElement.action ? actionElement.action.isFocusable() && !actionElement.folded : actionElement.element.isVisible();
    }

    private getNextFocusableActionIndex(): number {
        let focusIndex = this.lastFocusedActionIndex;
        const currentFocusIndex = focusIndex;
        const limit = this.actionElements.length;

        do {
            focusIndex++;
            if (focusIndex === limit) {
                focusIndex = 0;
            }
        } while (focusIndex !== currentFocusIndex && !this.isActionFocusable(this.actionElements[focusIndex]));

        if (focusIndex === currentFocusIndex) {
            return -1;
        }

        return focusIndex;
    }

    private getPreviousFocusableActionIndex(): number {
        let focusIndex = this.lastFocusedActionIndex;
        const currentFocusIndex = focusIndex;
        const lastIndex = this.actionElements.length - 1;

        do {
            focusIndex--;
            if (focusIndex === -1) {
                focusIndex = lastIndex;
            }
        } while (focusIndex !== currentFocusIndex && !this.isActionFocusable(this.actionElements[focusIndex]));

        return focusIndex;
    }

    private focusActionElement(): void {
        let lastFocusedActionElement = this.getFocusedActionElement();
        if (!lastFocusedActionElement) {
            const focusIndex = this.getNextFocusableActionIndex();
            this.lastFocusedActionIndex = focusIndex;
            lastFocusedActionElement = this.actionElements[focusIndex].element;
        }

        lastFocusedActionElement.giveFocus();
    }

    private createActionButton(action: Action): ActionButton {
        action.isFoldable() && action.onPropertyChanged(() => this.foldOrExpand());
        return new ActionButton(action);
    }

    private initElementListeners(element: Element) {
        let eventHandled = false;
        let focusOnClick = false;
        element.onKeyDown((event: KeyboardEvent) => {
            if (KeyHelper.isTabKey(event) && !KeyHelper.isShiftKey(event)) {
                eventHandled = true;
                element.giveBlur();

                element.getChildren().forEach((child: Element) => {
                    child.giveBlur();
                });
                this.removeFocus();
            } else if (KeyHelper.isArrowRightKey(event)) {
                eventHandled = true;
                this.focusNextAction();
            } else if (KeyHelper.isArrowLeftKey(event)) {
                eventHandled = true;
                this.focusPreviousAction();
            }

            if (eventHandled) {
                event.stopImmediatePropagation();
                event.preventDefault();
                return;
            }
        });

        const onFocus = (event: FocusEvent) => {
            if (focusOnClick) {
                focusOnClick = false;

                event.stopImmediatePropagation();
                event.preventDefault();
                return;
            }
            this.focusToolbar();
            const focusFromOutsideToolbar = !this.getEl().getHTMLElement().contains(event.relatedTarget as Node);
            if (focusFromOutsideToolbar) {
                this.focusActionElement();
            }
        };

        const onBlur = (event: FocusEvent) => {
            // If newly focused element is not a part of the toolbar, remove focus from the toolbar
            if (!this.getEl().getHTMLElement().contains(event.relatedTarget as Node)) {
                element.getChildren().forEach((child: Element) => {
                    child.giveBlur();
                });
                this.removeFocus();
            }
        };

        element.onFocus((event: FocusEvent) => onFocus(event));
        element.onMouseDown((event) => {
            focusOnClick = true;
            this.lastFocusedActionIndex = this.getActionIndexByElement(element);
        });
        element.onBlur((event: FocusEvent) => onBlur(event));

        element.whenRendered(() => {
            element.getChildren().forEach((child: Element) => {
                child.onFocus((event: FocusEvent) => onFocus(event));
            });
        });
    }

    private isFocused(): boolean {
        return this.hasClassEx('focused');
    }

    private focusAction(getActionIndex: () => number) {
        const focusIndex = getActionIndex();
        if (focusIndex !== -1) {
            if (!this.isFocused()) {
                this.giveFocus();
            }
            this.lastFocusedActionIndex = focusIndex;
            this.actionElements[focusIndex].element.giveFocus();
        }
    }

    private focusNextAction() {
        this.focusAction(() => this.getNextFocusableActionIndex());
    }

    private focusPreviousAction() {
        this.focusAction(() => this.getPreviousFocusableActionIndex());
    }

    prependActionElement(element: Element, isTabbable: boolean = true): Element {
        this.initElementListeners(element);
        this.prependChild(element);

        if (isTabbable) {
            this.actionElements.splice(0, 0, {
                element
            });
        }

        return element;
    }

    addActionElement(element: Element, isTabbable: boolean = true): Element {
        if (this.foldButton) {
            this.addGreedySpacer();
        }
        this.addElement(element);
        if (isTabbable) {
            this.actionElements.push({
                element: element
            });
        }

        return element;
    }

    private addFoldButton() {
        const foldButton = new FoldButton();
        foldButton.hide();

        this.addActionElement(foldButton);

        this.foldButton = foldButton;
    }

    addGreedySpacer() {
        this.hasGreedySpacer = true;
    }

    private getActionIndexByElement(element: Element): number {
        return this.actionElements.findIndex((actionElement: ActionElement) => actionElement.element === element);
    }

    protected addElement(element: Element): Element {
        this.initElementListeners(element);

        if (this.hasGreedySpacer) {
            element.addClass('pull-right');
            this.appendChild(element);
        } else {
            if (this.foldButton?.hasParent()) {
                element.insertBeforeEl(this.foldButton);
            } else {
                this.appendChild(element);
            }
        }

        return element;
    }

    prependAction(action: Action): ActionButton {
        return this.addAction(action, true);
    }

    addAction(action: Action, prepend: boolean = false): ActionButton {
        if (!this.foldButton) {
            this.addFoldButton();
        }

        const actionButton = this.createActionButton(action);

        this.actionElements.splice(prepend ? 0 : this.lastActionIndex + 1, 0, {
            element: actionButton,
            action: action
        });
        this.addElement(actionButton);
        this.lastActionIndex++;

        return actionButton;
    }

    addActions(actions: Action[]) {
        actions.forEach((action) => this.addAction(action));
    }

    removeActions() {
        this.actionElements.forEach((actionElement: ActionElement) => !!actionElement.action && this.removeAction(actionElement.action));
    }

    removeAction(action: Action): void {
        const indexToRemove = this.actionElements.findIndex((a: ActionElement) => a.action === action);
        if (indexToRemove === -1) {
            return;
        }
        this.actionElements[indexToRemove].element.remove();
        this.actionElements.slice(indexToRemove, 1);
    }

    getActions(): Action[] {
        return this.actionElements
            .filter((actionElement: ActionElement) => actionElement.action ?? false)
            .map((actionElement: ActionElement) => actionElement.action);
    }

    removeGreedySpacer() {
        this.hasGreedySpacer = false;
    }

    private updateVisibleButtonsWidth() {
        this.visibleButtonsWidth = this.getVisibleButtonsWidth();
    }

    protected foldOrExpand() {
        if (!this.isRendered() || !this.isVisible() || this.locked) {
            return;
        }

        let foldChanged = false;

        if (!this.visibleButtonsWidth) {
            this.updateVisibleButtonsWidth();
        }

        if (this.getToolbarWidth() <= this.visibleButtonsWidth) {
            this.fold();
            foldChanged = true;
        } else if (!this.foldButton.isEmpty()) {
            this.expand();
            foldChanged = true;
        }

        foldChanged && this.updateFoldButtonLabel();
    }

    fold(force: boolean = false): void {
        const toolbarWidth: number = this.getToolbarWidth();
        let nextFoldableButton: Element = this.getNextFoldableButton();
        let visibleButtonsWidth = this.visibleButtonsWidth;

        while (nextFoldableButton && (force || toolbarWidth <= visibleButtonsWidth)) {
            const buttonWidth: number = nextFoldableButton.getEl().getWidthWithBorder();

            this.removeChild(nextFoldableButton);
            this.foldButton.push(nextFoldableButton, buttonWidth);
            this.actionElements[this.lastActionIndex].folded = true;
            visibleButtonsWidth -= buttonWidth;

            nextFoldableButton = this.getNextFoldableButton();
            this.lastActionIndex--;
        }

        if (!this.foldButton.isEmpty() && !this.foldButton.isVisible()) {
            this.foldButton.show();
        }

        this.updateVisibleButtonsWidth();
    }

    expand(): void {
        const toolbarWidth: number = this.getToolbarWidth();
        const foldButtonWidth: number = this.foldButton.getButtonsCount() > 1 ? 0 : this.foldButton.getEl().getWidthWithBorder();
        let visibleButtonsWidth = this.visibleButtonsWidth;

        // if fold has 1 child left then subtract fold button width because it will be hidden
        while (!this.foldButton.isEmpty() && visibleButtonsWidth + this.foldButton.getNextButtonWidth() < toolbarWidth) {

            const buttonToShow = this.foldButton.pop();
            buttonToShow.insertBeforeEl(this.foldButton);
            visibleButtonsWidth += buttonToShow.getEl().getWidthWithBorder();
            this.actionElements[this.lastActionIndex + 1].folded = false;

            this.lastActionIndex++;
            if (this.foldButton.getButtonsCount() === 1) {
                visibleButtonsWidth -= foldButtonWidth;
            }
        }

        if (this.foldButton.isEmpty() && this.foldButton.isVisible()) {
            this.foldButton.hide();
        }

        this.updateVisibleButtonsWidth();
    }

    protected getToolbarWidth(): number {
        return this.getEl().getWidthWithoutPadding();
    }

    private getVisibleButtonsWidth(): number {
        return this.getChildren().reduce((totalWidth: number, element: Element) =>
            totalWidth + (element.isVisible() ? element.getEl().getWidthWithBorder() : 0), 0);
    }

    private getNextFoldableButton(): Element {
        let index = this.lastActionIndex;

        while (index >= 0) {
            const button: Element = this.actionElements[index].element;
            if (this.actionElements[index].action?.isFoldable() && this.isItemAllowedToFold(button)) {
                return button;
            }

            index--;
        }

        return null;
    }

    protected isItemAllowedToFold(elem: Element): boolean {
        return elem.isVisible();
    }

    private areAllActionsFolded(): boolean {
        return this.getActions().length === this.foldButton.getButtonsCount();
    }

    setLocked(value: boolean): void {
        this.locked = value;
    }

    isLocked(): boolean {
        return this.locked;
    }

    updateFoldButtonLabel(): void {
        this.setFoldButtonLabel(this.areAllActionsFolded() ? i18n('action.actions') : i18n('action.more'));
    }

    setFoldButtonLabel(value: string): void {
        this.foldButton.setLabel(value);
    }
}
