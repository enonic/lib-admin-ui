import {FieldsetEl} from '../../dom/FieldsetEl';
import {LegendEl} from '../../dom/LegendEl';
import {FormItem} from './FormItem';
import {ValidityChangedEvent} from '../../ValidityChangedEvent';
import {ValidationResult} from './ValidationResult';

export class Fieldset
    extends FieldsetEl {

    private legend: LegendEl;

    private items: FormItem[] = [];

    private focusListeners: ((event: FocusEvent) => void)[] = [];

    private blurListeners: ((event: FocusEvent) => void)[] = [];

    private validityChangedListeners: ((event: ValidityChangedEvent) => void)[] = [];

    constructor(legend?: string) {
        super();
        if (legend) {
            this.legend = new LegendEl(legend);
            this.appendChild(this.legend);
        }
    }

    add(formItem: FormItem) {
        formItem.onFocus((event: FocusEvent) => {
            this.notifyFocused(event);
        });

        formItem.onBlur((event: FocusEvent) => {
            this.notifyBlurred(event);
        });

        formItem.onValidityChanged((event) => {
            this.notifyValidityChanged(event.isValid());
        });

        this.items.push(formItem);

        this.appendChild(formItem);
    }

    removeItem(formItem: FormItem) {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i] === formItem) {
                this.items.splice(i, 1);
                this.removeChild(formItem);
            }
        }
    }

    validate(validationResult: ValidationResult, markInvalid?: boolean) {
        this.items.forEach((item: FormItem) => {
            item.validate(validationResult, markInvalid);
        });
    }

    setFieldsetData(data: any) {
        let input;
        let inputValue;
        this.items.forEach((item: FormItem) => {
            input = item.getInput();
            inputValue = data[input.getName()];
            if (inputValue) {
                input.setValue(inputValue);
            }
        });
    }

    getFieldsetData(): any {
        let input;
        let data = {};
        this.items.forEach((item: FormItem) => {
            input = item.getInput();
            data[input.getName()] = input.getValue();
        });
        return data;
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

    onValidityChanged(listener: (event: ValidityChangedEvent) => void) {
        this.validityChangedListeners.push(listener);
    }

    unValidityChanged(listener: (event: ValidityChangedEvent) => void) {
        this.validityChangedListeners = this.validityChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    notifyValidityChanged(valid: boolean) {
        this.validityChangedListeners.forEach((listener: (event: ValidityChangedEvent) => void) => {
            listener.call(this, new ValidityChangedEvent(valid));
        });
    }

    private notifyFocused(event: FocusEvent) {
        this.focusListeners.forEach((listener) => {
            listener(event);
        });
    }

    private notifyBlurred(event: FocusEvent) {
        this.blurListeners.forEach((listener) => {
            listener(event);
        });
    }
}
