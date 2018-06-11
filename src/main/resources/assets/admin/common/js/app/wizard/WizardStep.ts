module api.app.wizard {

    export class WizardStep extends BaseWizardStep<api.ui.tab.TabBarItem> {

        constructor(label: string, stepForm: WizardStepForm) {

            const tabBarItem = new api.ui.tab.TabBarItemBuilder()
                .setAddLabelTitleAttribute(true)
                .setLabel(label)
                .setFocusable(false)
                .build();

            super(tabBarItem, stepForm);
        }
    }
}
