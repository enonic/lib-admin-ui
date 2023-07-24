import {DivEl} from '../../dom/DivEl';
import {Property} from '../../data/Property';
import {PropertyValueChangedEvent} from '../../data/PropertyValueChangedEvent';
import {ValueTypes} from '../../data/ValueTypes';

export class WizardHeader
    extends DivEl {

    private propertyChangedListeners: ((event: PropertyValueChangedEvent) => void)[] = [];

    constructor() {
        super('wizard-header');
    }

    onPropertyChanged(listener: (event: PropertyValueChangedEvent) => void) {
        this.propertyChangedListeners.push(listener);
    }

    unPropertyChanged(listener: (event: PropertyValueChangedEvent) => void) {
        this.propertyChangedListeners =
            this.propertyChangedListeners.filter((currentListener: (event: PropertyValueChangedEvent) => void) => {
                return listener !== currentListener;
            });
    }

    notifyPropertyChanged(property: Property, oldValue: string, newValue: string) {
        //let event = new PropertyChangedEvent(property, oldValue, newValue);
        const event = new PropertyValueChangedEvent(property, ValueTypes.STRING.newValue(oldValue), ValueTypes.STRING.newValue(newValue));
        this.propertyChangedListeners.forEach((listener: (event: PropertyValueChangedEvent) => void) => {
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
