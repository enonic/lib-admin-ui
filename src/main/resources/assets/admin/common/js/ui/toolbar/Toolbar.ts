import {Body} from '../../dom/Body';
import {DivEl} from '../../dom/DivEl';
import {Element} from '../../dom/Element';
import {ObjectHelper} from '../../ObjectHelper';
import {i18n} from '../../util/Messages';
import {Action} from '../Action';
import {ActionContainer} from '../ActionContainer';
import {ActionButton} from '../button/ActionButton';
import {KeyHelper} from '../KeyHelper';
import {ResponsiveManager} from '../responsive/ResponsiveManager';
import {AriaRole, WCAG} from '../WCAG';
import {FoldButton} from './FoldButton';

interface ToolbarElement {
    el: Element | ActionButton;
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
    protected toolbarElements: ToolbarElement[] = [];
    private locked: boolean;
    private hasGreedySpacer: boolean;
    private lastFocusedElementIndex = -1;

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
            this.focusElement();
        };

        // Hack: Update after styles are applied to evaluate the sizes correctly
        ResponsiveManager.onAvailableSizeChanged(this, () => window.setTimeout(this.foldOrExpand.bind(this)));

        this.onFocus(() => onToolbarFocused());
    }

    private getFocusedElement(): Element {
        if (this.lastFocusedElementIndex === -1) {
            return null;
        }

        const lastFocusedElement = this.toolbarElements[this.lastFocusedElementIndex];
        if (lastFocusedElement.folded || !lastFocusedElement.el.isFocusable()) {
            return null;
        }

        return lastFocusedElement.el;
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
        if (this.getFocusedElement()) {
            this.getFocusedElement()?.giveBlur();
        }
        this.removeClassEx('focused');
        Body.get().onMouseUp(this.mouseClickListener);
        this.mouseClickListener = null;
    }

    private isActionButton(el: Element | ActionButton): el is ActionButton {
        return (el as ActionButton).getAction !== undefined;
    }

    private isElementFocusable(element: ToolbarElement): boolean {
         if (this.isActionButton(element.el)) {
            return !element.folded && element.el.isFocusable();
        }

        return element.el.isVisible();
    }

    private getNextFocusableElementIndex(): number {
        let focusIndex = this.lastFocusedElementIndex;
        const currentFocusIndex = focusIndex;
        const limit = this.toolbarElements.length;

        do {
            focusIndex++;
            if (focusIndex === limit) {
                if (currentFocusIndex === -1) {
                    return -1;
                }
                focusIndex = 0;
            }
        } while (focusIndex !== currentFocusIndex && !this.isElementFocusable(this.toolbarElements[focusIndex]));

        if (focusIndex === currentFocusIndex) {
            return -1;
        }

        return focusIndex;
    }

    private getPreviousFocusableElementIndex(): number {
        let focusIndex = this.lastFocusedElementIndex;
        const currentFocusIndex = focusIndex;
        const lastIndex = this.toolbarElements.length - 1;

        do {
            focusIndex--;
            if (focusIndex === -1) {
                focusIndex = lastIndex;
            }
        } while (focusIndex !== currentFocusIndex && !this.isElementFocusable(this.toolbarElements[focusIndex]));

        return focusIndex;
    }

    private focusElement(): void {
        let lastFocusedElement = this.getFocusedElement();
        if (!lastFocusedElement) {
            const focusIndex = this.getNextFocusableElementIndex();
            this.lastFocusedElementIndex = focusIndex;
            lastFocusedElement = this.toolbarElements[focusIndex]?.el;
        }

        lastFocusedElement?.giveFocus();
    }

    private createActionButton(action: Action): ActionButton {
        if (action.isFoldable()) {
            action.onPropertyChanged(() => this.foldOrExpand());
        }
        return new ActionButton(action);
    }

    private initElementListeners(element: Element) {
        let eventHandled = false;
        let focusOnClick = false;
        element.onKeyDown((event: KeyboardEvent) => {
            if (KeyHelper.isTabKey(event) && !KeyHelper.isShiftKey(event)) {
                eventHandled = true;
                element.giveBlur();
                this.removeFocus();
            } else if (KeyHelper.isArrowRightKey(event)) {
                eventHandled = true;
                this.focusNextElement();
            } else if (KeyHelper.isArrowLeftKey(event)) {
                eventHandled = true;
                this.focusPreviousElement();
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
                this.focusElement();
            }
        };

        const onBlur = (event: FocusEvent) => {
            focusOnClick = false;
            // If newly focused element is not a part of the toolbar, remove focus from the toolbar
            if (!this.getEl().getHTMLElement().contains(event.relatedTarget as Node)) {
                this.removeFocus();
            }
        };

        element.onFocus((event: FocusEvent) => onFocus(event));
        element.onMouseDown((event) => {
            focusOnClick = true;
            this.lastFocusedElementIndex = this.getIndexOfToolbarElement(element);
        });
        element.onBlur((event: FocusEvent) => onBlur(event));
    }

    private isFocused(): boolean {
        return this.hasClassEx('focused');
    }

    private focusElementByIndex(getElementIndex: () => number) {
        const focusIndex = getElementIndex();
        if (focusIndex !== -1) {
            if (!this.isFocused()) {
                this.giveFocus();
            }
            this.lastFocusedElementIndex = focusIndex;
            this.toolbarElements[focusIndex].el.giveFocus();
        }
    }

    private focusNextElement() {
        this.focusElementByIndex(() => this.getNextFocusableElementIndex());
    }

    private focusPreviousElement() {
        this.focusElementByIndex(() => this.getPreviousFocusableElementIndex());
    }

    addContainer(container: Element, elements: Element[]): Element {
        if (this.foldButton) {
            this.addGreedySpacer();
        }

        elements.forEach(element => this.addTabbable(element));

        return this.appendChild(container);
    }

    addElement(element: Element, tabbable: boolean = true): Element {
        if (this.foldButton) {
            this.addGreedySpacer();
        }

        if (tabbable) {
            this.addTabbable(element);
        }

        return this.appendChild(element);
    }

    private addFoldButton() {
        const foldButton = new FoldButton();
        foldButton.addClass('hidden');

        this.addElement(foldButton);

        this.foldButton = foldButton;
    }

    addGreedySpacer() {
        this.hasGreedySpacer = true;
    }

    private getIndexOfToolbarElement(element: Element): number {
        return this.toolbarElements.findIndex((toolbarElement: ToolbarElement) => toolbarElement.el === element);
    }

    private getFoldButtonIndex(): number {
        return this.getIndexOfToolbarElement(this.foldButton);
    }

    appendChild(element: Element | ActionButton): Element {
        if (this.hasGreedySpacer) {
            element.addClass('pull-right');
            return super.appendChild(element);
        }

        if (this.isActionButton(element) && this.foldButton?.hasParent()) {
            return element.insertBeforeEl(this.foldButton);
        }

        return super.appendChild(element);
    }

    protected addTabbable(element: Element, index?: number) {
        this.initElementListeners(element);
        if (ObjectHelper.isDefined(index)) {
            this.toolbarElements.splice(index, 0, {el: element});
        } else {
            this.toolbarElements.push({el: element});
        }
    }

    addAction(action: Action): ActionButton {
        if (!this.foldButton) {
            this.addFoldButton();
        }

        const actionButton = this.createActionButton(action);

        this.addTabbable(actionButton, this.getFoldButtonIndex());
        this.appendChild(actionButton);

        return actionButton;
    }

    addActions(actions: Action[]) {
        actions.forEach((action) => this.addAction(action));
    }

    removeActions() {
        this.toolbarElements.forEach((toolbarElement: ToolbarElement) => this.isActionButton(toolbarElement.el) && this.removeAction(toolbarElement.el.getAction()));
    }

    removeAction(targetAction: Action): void {
        const indexToRemove = this.getActions().findIndex((action: Action) => action === targetAction);
        if (indexToRemove === -1) {
            return;
        }
        this.toolbarElements[indexToRemove].el.remove();
        this.toolbarElements.slice(indexToRemove, 1);
    }

    getActions(): Action[] {
        return this.toolbarElements
            .filter((element: ToolbarElement) => this.isActionButton(element.el))
            .map((element: ToolbarElement) => (element.el as ActionButton).getAction());
    }

    removeGreedySpacer() {
        this.hasGreedySpacer = false;
    }

    protected foldOrExpand() {
        if (!this.foldButton || !this.isRendered() || !this.isVisible() || this.locked) {
            return;
        }

        let foldChanged = false;

        if (this.getEl().isOverflown()) {
            this.fold();
            foldChanged = true;
        } else if (!this.foldButton.isEmpty()) {
            this.expand();
            foldChanged = true;
        }

        if (foldChanged) {
            this.updateFoldButtonLabel();
        }
    }

    fold(force: boolean = false): void {
        let nextFoldableButton: Element = this.getNextFoldableButton();

        while (nextFoldableButton && (force || this.getEl().isOverflown())) {
            const buttonWidth: number = nextFoldableButton.getEl().getWidthWithBorder();

            this.removeChild(nextFoldableButton);
            this.foldButton.push(nextFoldableButton, buttonWidth);

            const foldIndex = this.getIndexOfToolbarElement(nextFoldableButton);
            this.toolbarElements[foldIndex].folded = true;

            nextFoldableButton = this.getNextFoldableButton();

            if (this.foldButton.hasClass('hidden')) {
                this.foldButton.removeClass('hidden');
            }
        }
    }

    expand(): void {
        const toolbarWidth: number = this.getToolbarWidth();
        const foldButtonWidth: number = this.foldButton.getButtonsCount() > 1 ? 0 : this.foldButton.getEl().getWidthWithBorder();
        let visibleButtonsWidth = this.getVisibleButtonsWidth();

        // if fold has 1 child left then subtract fold button width because it will be hidden
        while (!this.foldButton.isEmpty() && visibleButtonsWidth + this.foldButton.getNextButtonWidth() < toolbarWidth) {
            const nextExpandableButton = this.foldButton.pop();
            nextExpandableButton.insertBeforeEl(this.foldButton);
            visibleButtonsWidth += nextExpandableButton.getEl().getWidthWithBorder();

            const index = this.getIndexOfToolbarElement(nextExpandableButton);
            this.toolbarElements[index].folded = false;

            if (this.foldButton.getButtonsCount() === 1) {
                visibleButtonsWidth -= foldButtonWidth;
            }
        }

        if (this.foldButton.isEmpty() && !this.foldButton.hasClass('hidden')) {
            this.foldButton.collapse();
            this.foldButton.addClass('hidden');
        }
    }

    protected getToolbarWidth(): number {
        return this.getEl().getWidthWithoutPadding();
    }

    private getVisibleButtonsWidth(): number {
        return this.getChildren().reduce((totalWidth: number, element: Element) =>
            totalWidth + (element.isVisible() ? element.getEl().getWidthWithBorder() : 0), 0);
    }

    private getNextFoldableButton(): Element {
        let index = this.getFoldButtonIndex() - 1;

        while (index >= 0) {
            if (this.isActionButton(this.toolbarElements[index].el) && this.toolbarElements[index].folded !== true) {
                const button = this.toolbarElements[index].el as ActionButton;

                if (button.getAction().isFoldable() && this.isItemAllowedToFold(button)) {
                    return button;
                }
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
