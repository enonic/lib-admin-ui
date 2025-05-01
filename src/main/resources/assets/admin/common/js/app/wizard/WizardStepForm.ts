import {ValidationRecording} from '../../form/ValidationRecording';
import {Panel} from '../../ui/panel/Panel';
import {WizardStepValidityChangedEvent} from './WizardStepValidityChangedEvent';

export class WizardStepForm
    extends Panel {

    private validityChangedListeners: ((event: WizardStepValidityChangedEvent) => void)[] = [];
    private focusListeners: ((event: FocusEvent) => void)[] = [];

    private blurListeners: ((event: FocusEvent) => void)[] = [];

    constructor(className?: string) {
        super(className);
        this.addClass('wizard-step-form');
    }

    /*
     *   public to be used by inheritors
     */
    public validate(): ValidationRecording {
        return new ValidationRecording();
    }

    public isValid(): boolean {
        return true;
    }

    onValidityChanged(listener: (event: WizardStepValidityChangedEvent) => void) {
        this.validityChangedListeners.push(listener);
    }

    unValidityChanged(listener: (event: WizardStepValidityChangedEvent) => void) {
        this.validityChangedListeners = this.validityChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    /*
     *   public to be used by inheritors
     */
    notifyValidityChanged(event: WizardStepValidityChangedEvent) {
        this.validityChangedListeners.forEach((listener) => {
            listener(event);
        });
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.focusListeners.push(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.focusListeners = this.focusListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.blurListeners.push(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.blurListeners = this.blurListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    /*
     *   public to be used by inheritors
     */
    notifyFocused(event: FocusEvent) {
        this.focusListeners.forEach((listener) => {
            listener(event);
        });
    }

    /*
     *   public to be used by inheritors
     */
    notifyBlurred(event: FocusEvent) {
        this.blurListeners.forEach((listener) => {
            listener(event);
        });
    }

    toggleHelpText(_show?: boolean) {
        if (!this.hasHelpText()) {
            return;
        }
        throw new Error('Must be overriden by inheritor');
    }

    hasHelpText(): boolean {
        return false; // TO BE OVERRIDEN BY INHERITORS
    }

    setEnabled(enable: boolean) {
    //
    }

}
