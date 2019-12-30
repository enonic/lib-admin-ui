import {TabBarItem, TabBarItemBuilder} from '../../ui/tab/TabBarItem';
import {BaseWizardStep} from './BaseWizardStep';
import {WizardStepForm} from './WizardStepForm';

export class WizardStep
    extends BaseWizardStep<TabBarItem> {

    constructor(label: string, stepForm: WizardStepForm) {

        const tabBarItem = new TabBarItemBuilder()
            .setAddLabelTitleAttribute(true)
            .setLabel(label)
            .setFocusable(false)
            .build();

        super(tabBarItem, stepForm);
    }
}
