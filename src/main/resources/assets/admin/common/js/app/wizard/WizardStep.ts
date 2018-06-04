module api.app.wizard {

    export class WizardStep {

        private tabBarItem: api.ui.tab.TabBarItem;

        private stepForm: WizardStepForm;

        constructor(label: string, stepForm: WizardStepForm, iconCls?: string) {
            this.tabBarItem =
                new api.ui.tab.TabBarItemBuilder()
                    .setAddLabelTitleAttribute(!!iconCls || false)
                    .setLabel(label)
                    .setFocusable(false)
                    .setIconCls(iconCls)
                    .build();
            this.stepForm = stepForm;
        }

        getTabBarItem(): api.ui.tab.TabBarItem {
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
            } else {
                this.tabBarItem.hide();
                this.stepForm.hide();
            }
        }
    }
}
