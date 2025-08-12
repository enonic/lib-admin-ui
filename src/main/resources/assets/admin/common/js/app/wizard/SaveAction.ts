import Q from 'q';
import {DefaultErrorHandler} from '../../DefaultErrorHandler';
import {Action} from '../../ui/Action';
import {i18n} from '../../util/Messages';
import {WizardPanel} from './WizardPanel';

export class SaveAction
    extends Action {

    constructor(wizardPanel: WizardPanel<any>, label: string = i18n('action.save')) {
        super(label, 'mod+s', true);

        this.onExecuted(() => {

            this.setEnabled(false);

            return this.saveChanges(wizardPanel);
        });
    }

    protected saveChanges(wizardPanel: WizardPanel<any>): Q.Promise<any> {
        return wizardPanel.saveChanges().catch((reason) => DefaultErrorHandler.handle(reason)).finally(() => this.setEnabled(true));
    }
}
