import {ActionButton} from '../button/ActionButton';
import {i18n} from '../../util/Messages';
import {DivEl} from '../../dom/DivEl';
import {ActionContainer} from '../ActionContainer';
import {Action} from '../Action';
import {ResponsiveManager} from '../responsive/ResponsiveManager';
import {Element} from '../../dom/Element';
import {ObjectHelper} from '../../ObjectHelper';
import {FoldButton} from './FoldButton';
import {IWCAG as WCAG, AriaRole} from '../WCAG';

export class Toolbar
    extends DivEl
    implements ActionContainer, WCAG {

    [WCAG]: boolean = true;
    ariaLabel: string = i18n('wcag.toolbar.label');
    role: AriaRole = AriaRole.TOOLBAR;
    tabbable: boolean = true;

    protected foldButton: FoldButton;
    protected actions: Action[] = [];
    private locked: boolean;
    private hasGreedySpacer: boolean;

    constructor(className?: string) {
        super(!className ? 'toolbar' : className + ' toolbar');

        this.foldButton = new FoldButton();
        this.foldButton.hide();
        this.appendChild(this.foldButton);

        // Hack: Update after styles are applied to evaluate the sizes correctly
        ResponsiveManager.onAvailableSizeChanged(this, () => window.setTimeout(this.foldOrExpand.bind(this)));

        this.onShown(() => this.foldOrExpand());
    }

    addAction(action: Action): ActionButton {
        this.actions.push(action);

        const actionButton: ActionButton = new ActionButton(action);

        action.onPropertyChanged(() => this.foldOrExpand());
        this.addElement(actionButton);

        return actionButton;
    }

    addActions(actions: Action[]) {
        actions.forEach((action) => {
            this.addAction(action);
        });
    }

    removeActions() {
        this.actions.forEach((action: Action) => {
            this.removeAction(action);
        });
        this.actions = [];
    }

    removeAction(action: Action): void {
        this.getChildren().concat(this.foldButton.getDropdown().getChildren()).forEach((element: Element) => {
            if (ObjectHelper.iFrameSafeInstanceOf(element, ActionButton)) {
                if (action.getLabel() === (element as ActionButton).getLabel()) {
                    element.remove();
                    this.actions = this.actions.filter((a: Action) => a !== action);
                }
            }
        });
    }

    getActions(): Action[] {
        return this.actions;
    }

    addElement(element: Element): Element {
        if (this.hasGreedySpacer) {
            element.addClass('pull-right');
            element.insertAfterEl(this.foldButton);
        } else {
            element.insertBeforeEl(this.foldButton);
        }

        return element;
    }

    addGreedySpacer() {
        this.hasGreedySpacer = true;
    }

    removeGreedySpacer() {
        this.hasGreedySpacer = false;
    }

    protected foldOrExpand() {
        if (!this.isRendered() || !this.isVisible() || this.locked) {
            return;
        }

        if (this.getToolbarWidth() <= this.getVisibleButtonsWidth()) {
            this.fold();
        } else {
           this.expand();
        }

        this.updateFoldButtonLabel();
    }

    fold(force: boolean = false): void {
        const toolbarWidth: number = this.getToolbarWidth();
        let nextFoldableButton: Element = this.getNextFoldableButton();

        while (nextFoldableButton && (force || toolbarWidth <= this.getVisibleButtonsWidth())) {
            const buttonWidth: number = nextFoldableButton.getEl().getWidthWithMargin();

            this.removeChild(nextFoldableButton);
            this.foldButton.push(nextFoldableButton, buttonWidth);

            if (!this.foldButton.isVisible()) {
                this.foldButton.show();
            }

            nextFoldableButton = this.getNextFoldableButton();
        }
    }

    protected getToolbarWidth(): number {
        return this.getEl().getWidthWithoutPadding();
    }

    expand(): void {
        const toolbarWidth: number = this.getToolbarWidth();

        // if fold has 1 child left then subtract fold button width because it will be hidden
        while (!this.foldButton.isEmpty() &&
               (this.getVisibleButtonsWidth(this.foldButton.getButtonsCount() > 1) + this.foldButton.getNextButtonWidth() < toolbarWidth)) {

            let buttonToShow = this.foldButton.pop();
            buttonToShow.insertBeforeEl(this.foldButton);

            if (this.foldButton.isEmpty()) {
                this.foldButton.hide();
            }
        }
    }

    private getVisibleButtonsWidth(includeFold: boolean = true): number {
        return this.getChildren().reduce((totalWidth: number, element: Element) => {
            return totalWidth + (element.isVisible() && (includeFold || element !== this.foldButton) ?
                                 element.getEl().getWidthWithBorder() : 0);
        }, 0);
    }

    private getNextFoldableButton(): Element {
        let button: Element = this.foldButton.getPreviousElement();

        while (button) {
            if (this.isItemAllowedToFold(button)) {
                return this.getChildren().filter((child) => child.getId() === button.getId())[0];
            }

            const prevEl: Element = button.getPreviousElement();

            if (prevEl && button.getParentElement() !== prevEl.getParentElement()) {
                return null;
            }

            button = button.getPreviousElement();
        }

        return null;
    }

    protected isItemAllowedToFold(elem: Element): boolean {
        return elem.isVisible();
    }

    private areAllActionsFolded(): boolean {
        return this.actions.length === this.foldButton.getButtonsCount();
    }

    setLocked(value: boolean): void {
        this.locked = value;
    }

    isLocked(): boolean {
        return this.locked;
    }

    updateFoldButtonLabel(): void {
        this.foldButton.setLabel(this.areAllActionsFolded() ? i18n('action.actions') : i18n('action.more'));
    }

    setFoldButtonLabel(value: string): void {
        this.foldButton.setLabel(value);
    }
}
