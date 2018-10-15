module api.app.wizard {

    export class BaseWizardStep<T extends api.ui.tab.TabItem> {

        private tabBarItem: T;

        protected stepForm: WizardStepForm;

        constructor(tabBarItem: T, stepForm: WizardStepForm) {

            this.tabBarItem = tabBarItem;
            this.stepForm = stepForm;
        }

        getTabBarItem(): T {
            return this.tabBarItem;
        }

        getStepForm(): WizardStepForm {
            return this.stepForm;
        }

        toggleHelpText(show?: boolean) {
            this.stepForm.toggleHelpText(show);
        }

        hasHelpText(): boolean {
            return this.stepForm.hasHelpText();
        }

        show(show: boolean) {
            if (show) {
                this.tabBarItem.show();
                this.stepForm.show();
                this.stepForm.showOuterHeader();
            } else {
                this.tabBarItem.hide();
                this.stepForm.hide();
                this.stepForm.hideOuterHeader();
            }
        }
    }
}
