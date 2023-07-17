import {DivEl} from '../../dom/DivEl';
import {PropertyChangedEvent} from '../../PropertyChangedEvent';

export class WizardHeader
    extends DivEl {

    private propertyChangedListeners: ((event: PropertyChangedEvent) => void)[] = [];

    constructor() {
        super('wizard-header');
    }

    onPropertyChanged(listener: (event: PropertyChangedEvent) => void) {
        this.propertyChangedListeners.push(listener);
    }

    unPropertyChanged(listener: (event: PropertyChangedEvent) => void) {
        this.propertyChangedListeners =
            this.propertyChangedListeners.filter((currentListener: (event: PropertyChangedEvent) => void) => {
                return listener !== currentListener;
            });
    }

    notifyPropertyChanged(property: string, oldValue: string, newValue: string) {
        let event = new PropertyChangedEvent(property, oldValue, newValue);
        this.propertyChangedListeners.forEach((listener: (event: PropertyChangedEvent) => void) => {
            listener.call(this, event);
        });
    }

    toggleEnabled(enable: boolean) {
    //
    }

    isValid(): boolean {
        return true;
    }

    giveFocus(): boolean {
        return false;
    }
}
