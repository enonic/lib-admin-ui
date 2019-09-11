import {Action} from '../../ui/Action';
import {WizardPanel} from './WizardPanel';

export class CloseAction
    extends Action {

    constructor(wizardPanel: WizardPanel<any>, checkCanClose: boolean = true) {
        super('Close', 'alt+w', true);
        this.onExecuted(() => {
            if (this.forceExecute) {
                wizardPanel.close(false);
            } else {
                wizardPanel.close(checkCanClose);
            }
        });
    }
}
