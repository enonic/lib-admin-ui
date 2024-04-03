import {NavigatedPanelStrip} from '../../ui/panel/NavigatedPanelStrip';
import {Element} from '../../dom/Element';
import {WizardStepNavigator} from './WizardStepNavigator';

export class WizardStepsPanel
    extends NavigatedPanelStrip {

    constructor(navigator: WizardStepNavigator, scrollable?: Element) {
        super(navigator, scrollable, 'wizard-steps-panel');
    }
}
