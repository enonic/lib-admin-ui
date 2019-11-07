import {WizardPanel} from './WizardPanel';

export class WizardClosedEvent {

    private wizard: WizardPanel<any>;

    private checkCanClose: boolean;

    constructor(wizard: WizardPanel<any>, checkCanClose: boolean) {
        this.wizard = wizard;
        this.checkCanClose = checkCanClose;
    }

    getWizard(): WizardPanel<any> {
        return this.wizard;
    }

    isCheckCanClose(): boolean {
        return this.checkCanClose;
    }
}
