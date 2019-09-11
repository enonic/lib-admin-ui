import {ActionButton} from '../button/ActionButton';
import {i18n} from '../../util/Messages';
import {DivEl} from '../../dom/DivEl';
import {ActionContainer} from '../ActionContainer';
import {Action} from '../Action';
import {ResponsiveManager} from '../responsive/ResponsiveManager';
import {Element} from '../../dom/Element';
import {ObjectHelper} from '../../ObjectHelper';

export class Toolbar
    extends DivEl
    implements ActionContainer {

    protected fold: FoldButton;
    protected actions: Action[] = [];
    private hasGreedySpacer: boolean;

    constructor(className?: string) {
        super(!className ? 'toolbar' : className + ' toolbar');

        this.fold = new FoldButton();
        this.fold.hide();
        this.appendChild(this.fold);

        // Hack: Update after styles are applied to evaluate the sizes correctly
        ResponsiveManager.onAvailableSizeChanged(this, () => setTimeout(this.foldOrExpand.bind(this)));

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
            this.getChildren().forEach((element: Element) => {
                if (ObjectHelper.iFrameSafeInstanceOf(element, ActionButton)) {
                    if (action.getLabel() === (<ActionButton>element).getLabel()) {
                        this.removeChild(element);
                    }
                }
            });
        });
        this.actions = [];
    }

    getActions(): Action[] {
        return this.actions;
    }

    addElement(element: Element): Element {
        if (this.hasGreedySpacer) {
            element.addClass('pull-right');
            element.insertAfterEl(this.fold);
        } else {
            element.insertBeforeEl(this.fold);
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
        if (!this.isRendered() || !this.isVisible()) {
            return;
        }

        let toolbarWidth = this.getEl().getWidthWithoutPadding();
        if (toolbarWidth <= this.getVisibleButtonsWidth()) {

            while (toolbarWidth <= this.getVisibleButtonsWidth() && this.getNextFoldableButton()) {

                let buttonToHide = this.getNextFoldableButton();
                let buttonWidth = buttonToHide.getEl().getWidthWithMargin();

                this.removeChild(buttonToHide);
                this.fold.push(buttonToHide, buttonWidth);

                if (!this.fold.isVisible()) {
                    this.fold.show();
                }
            }

        } else {
            // if fold has 1 child left then subtract fold button width because it will be hidden
            while (!this.fold.isEmpty() &&
                   (this.getVisibleButtonsWidth(this.fold.getButtonsCount() > 1) + this.fold.getNextButtonWidth() < toolbarWidth)) {

                let buttonToShow = this.fold.pop();
                buttonToShow.insertBeforeEl(this.fold);

                if (this.fold.isEmpty()) {
                    this.fold.hide();
                }
            }
        }

        this.fold.setLabel(this.areAllActionsFolded() ? i18n('action.actions') : i18n('action.more'));
    }

    private getVisibleButtonsWidth(includeFold: boolean = true): number {
        return this.getChildren().reduce((totalWidth: number, element: Element) => {
            return totalWidth + (element.isVisible() && (includeFold || element !== this.fold) ?
                                 element.getEl().getWidthWithBorder() : 0);
        }, 0);
    }

    private getNextFoldableButton(): Element {

        let button = this.fold.getPreviousElement();

        while (button) {
            if (button.isVisible()) {
                return this.getChildren().filter((child) => child.getId() === button.getId())[0];
            }
            const prevEl = button.getPreviousElement();
            if (prevEl && button.getParentElement() !== prevEl.getParentElement()) {
                return null;
            }
            button = button.getPreviousElement();
        }
    }

    private areAllActionsFolded(): boolean {
        return this.actions.length === this.fold.getButtonsCount();
    }

}

