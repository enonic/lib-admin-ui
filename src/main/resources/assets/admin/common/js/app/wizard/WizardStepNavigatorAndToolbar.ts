import Q from 'q';
import {DivEl} from '../../dom/DivEl';
import {ActivatedEvent} from '../../ui/ActivatedEvent';
import {TabBarItem} from '../../ui/tab/TabBarItem';
import {FoldButton} from '../../ui/toolbar/FoldButton';
import {Toolbar, ToolbarConfig} from '../../ui/toolbar/Toolbar';
import {WizardStepNavigator} from './WizardStepNavigator';

export class WizardStepNavigatorAndToolbar
    extends DivEl {

    static maxFittingWidth: number = 675;

    private static FOLDED: string = 'folded';

    private foldButton: FoldButton;

    private stepToolbar: Toolbar<ToolbarConfig>;

    private stepNavigator: WizardStepNavigator;

    private helpTextToggleButton: DivEl;

    constructor(stepNavigator: WizardStepNavigator, stepToolbar?: Toolbar<ToolbarConfig>) {
        super('wizard-step-navigator-and-toolbar');
        this.stepNavigator = stepNavigator;
        this.stepToolbar = stepToolbar;
        this.foldButton = new FoldButton();

        this.initListeners();
    }

    renumerateSteps() {
        if (this.isFolded()) {
            this.addNumbersToStepLabels(); // updating step numbers
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            if (this.stepToolbar) {
                this.appendChild(this.stepToolbar);
            }

            this.appendChild(this.foldButton);
            this.appendChild(this.stepNavigator);

            this.checkAndMinimize();

            return rendered;
        });
    }

    setupHelpTextToggleButton(): DivEl {
        this.helpTextToggleButton = new DivEl('help-text-button');

        this.appendChild(this.helpTextToggleButton).addClass('has-help-text-button');
        this.checkAndMinimize();

        return this.helpTextToggleButton;
    }

    checkAndMinimize() {
        if (!this.isRendered()) {
            return;
        }

        const isMinimized: boolean = this.isFolded();
        const isUpdateNeeded: boolean = this.isStepNavigatorFit() === isMinimized;

        if (!isUpdateNeeded) {
            return;
        }

        if (isMinimized) {
            this.maximize();
        } else {
            this.minimize();
        }
    }

    changeOrientation(horizontal: boolean) {
        const mustBeFolded = horizontal && this.isFolded();
        if (mustBeFolded) {
            this.fold();
        } else {
            this.unfold();
        }
        this.checkAndMinimize();
    }

    private initListeners() {
        this.foldButton.getDropdown().onClicked(() => {
            this.addClass('no-dropdown-hover');
            // Place call in the queue outside of the stack and current context,
            // so the repaint will be triggered between those two calls
            window.setTimeout(this.removeClass.bind(this, 'no-dropdown-hover'));
        });

        this.stepNavigator.onNavigationItemActivated((event: ActivatedEvent) => {
            const tabBarItem: TabBarItem = this.stepNavigator.getNavigationItem(event.getIndex());
            if (tabBarItem) {
                this.foldButton.setLabel(tabBarItem.getFullLabel());
            }
        });

        this.stepNavigator.onNavigationItemRemoved(() => this.renumerateSteps());
        this.stepNavigator.onNavigationItemAdded(() => this.renumerateSteps());
    }

    private calculateStepsWidth(): number {
        const steps = this.stepNavigator.getChildren().filter(step => step.isVisible());

        const stepMargin = (step) => step.getEl().getWidthWithMargin();
        return steps.reduce((totalStepWidth, step) => totalStepWidth + stepMargin(step), 0);
    }

    private isVisibleStepNavigatorFit(): boolean {
        const width = this.stepNavigator.getEl().getWidthWithoutPadding();
        const stepsWidth = this.calculateStepsWidth();

        return Math.ceil(width) - Math.ceil(stepsWidth) >= -1; // Issue in Chrome with steps bigger than parent by 1px
    }

    private isStepNavigatorFit(): boolean {
        // StepNavigator is minimized and not visible, or not rendered yet
        // Check with saved width

        if (!this.stepNavigator.getChildren()) {
            return true;
        }

        if (this.foldButton.isRendered()) {
            if (this.stepNavigator.isVisible()) {
                return this.isVisibleStepNavigatorFit();
            }

            this.maximize();
            const value = this.isVisibleStepNavigatorFit();
            this.minimize();

            return value;
        }

        const help = this.helpTextToggleButton;
        const width = (help && help.isVisible())
                      ? this.getEl().getWidthWithoutPadding() - help.getEl().getWidthWithMargin()
                      : this.getEl().getWidthWithoutPadding();

        const calculated = this.calculateStepsWidth();
        // Add to pixels delta to made the check work as it should, when scale is not 100%
        const fittingWidth = Math.min(calculated, WizardStepNavigatorAndToolbar.maxFittingWidth) + 2;

        return Math.ceil(width) >= Math.ceil(fittingWidth);
    }

    private isFolded(): boolean {
        return this.hasClass(WizardStepNavigatorAndToolbar.FOLDED);
    }

    private isMinimized(): boolean {
        return !!this.foldButton && this.foldButton.getDropdown().hasChild(this.stepNavigator);
    }

    private minimize() {
        this.addClass(WizardStepNavigatorAndToolbar.FOLDED);
        this.fold();
        this.addNumbersToStepLabels();
        if (this.stepNavigator.getSelectedNavigationItem()) {
            this.foldButton.setLabel(this.stepNavigator.getSelectedNavigationItem().getFullLabel());
        }
    }

    private maximize() {
        this.removeClass(WizardStepNavigatorAndToolbar.FOLDED);
        this.unfold();
        this.removeNumbersFromStepLabels();
    }

    private fold() {
        if (!this.isMinimized()) {
            this.removeChild(this.stepNavigator);
            this.foldButton.push(this.stepNavigator, 300);
        }
    }

    private unfold() {
        if (this.isMinimized()) {
            this.foldButton.pop();
            this.stepNavigator.insertAfterEl(this.foldButton);
        }
    }

    private addNumbersToStepLabels() {
        this.stepNavigator.getNavigationItems().filter((tab: TabBarItem) => this.isTabVisible(tab)).forEach(
            (tab: TabBarItem, index) => tab.numerate(index + 1));
    }

    private isTabVisible(tab: TabBarItem): boolean {
        return tab.getHTMLElement().style.display !== 'none';
    }

    private removeNumbersFromStepLabels() {
        this.stepNavigator.getNavigationItems().forEach(
            (tab: TabBarItem) => tab.unnumerate());
    }

}
