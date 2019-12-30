import {WizardStep} from './WizardStep';
import {WizardHeader} from './WizardHeader';
import {ValidityChangedEvent} from '../../ValidityChangedEvent';
import {WizardStepValidityChangedEvent} from './WizardStepValidityChangedEvent';

export class WizardValidityManager {

    private steps: WizardStep[];

    private header: WizardHeader;

    private prevValue: boolean;

    private validityChangedListeners: { (event: ValidityChangedEvent): void }[] = [];

    constructor() {
        this.steps = [];
        this.validityChangedListeners = [];
    }

    clearItems() {
        this.steps = [];
    }

    getSteps(): WizardStep[] {
        return this.steps;
    }

    addItem(step: WizardStep) {
        this.steps.push(step);
        step.getStepForm().onValidityChanged((event: WizardStepValidityChangedEvent) => {
            this.notifyValidityChanged(event.isValid());
        });
    }

    removeItem(step: WizardStep) {
        let index = this.steps.indexOf(step);
        if (index >= 0) {
            this.steps.splice(index, 1);

            if (!this.prevValue) {
                if (this.isAllValid()) {
                    this.notifyValidityChanged(true);
                }
            }
        }
    }

    setHeader(header: WizardHeader) {
        this.header = header;
        this.header.onPropertyChanged(() => {
            if (!this.header.isRendered()) {
                return;
            }
            this.notifyValidityChanged(this.header.isValid());
        });
    }

    isAllValid(): boolean {
        if (this.header && !this.header.isValid()) {
            return false;
        }

        for (let i = 0; i < this.steps.length; i++) {
            if (!this.steps[i].getStepForm().isValid()) {
                return false;
            }
        }

        return true;
    }

    onValidityChanged(listener: (event: ValidityChangedEvent) => void) {
        this.validityChangedListeners.push(listener);
    }

    unValidityChanged(listener: (event: ValidityChangedEvent) => void) {
        this.validityChangedListeners = this.validityChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    notifyValidityChanged(valid: boolean) {
        this.prevValue = valid;

        this.validityChangedListeners.forEach((listener: (event: ValidityChangedEvent) => void) => {
            listener.call(this, new ValidityChangedEvent(valid));
        });
    }

}
