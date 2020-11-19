import {FormInputEl} from '../dom/FormInputEl';
import {ElementRegistry} from '../dom/ElementRegistry';
import {RadioButton, RadioButtonConfig, RadioButtonLabel} from './RadioButton';

export enum RadioOrientation {
    VERTICAL,
    HORIZONTAL
}

export class RadioGroup
    extends FormInputEl {

    // Group name is similar to name, but have and addition counter
    // to prevent inappropriate behaviour of the radio group on one page
    // with the same names
    protected groupName: string;

    protected options: RadioButton[] = [];

    constructor(name: string, originalValue?: string) {
        super('div', 'radio-group', undefined, originalValue);
        this.setName(name);
        this.groupName = `${name}-${ElementRegistry.getElementCountById(this.getId())}`;
    }

    public setOrientation(orientation: RadioOrientation): RadioGroup {
        this.toggleClass('vertical', orientation === RadioOrientation.VERTICAL);
        return this;
    }

    public addOption(value: string, label: RadioButtonLabel): RadioButton {
        const checked = value === this.getOriginalValue();
        const radio = this.createRadioButton({label, value, checked, name: this.groupName});
        this.options.push(radio);
        this.appendChild(radio);
        return radio;
    }

    protected createRadioButton(config: RadioButtonConfig): RadioButton {
        const radio = new RadioButton(config);
        radio.onValueChanged(() => {
            this.setValue(this.doGetValue(), false, true);
        });
        return radio;
    }

    doSetValue(value: string): RadioGroup {
        let option;
        for (let i = 0; i < this.options.length; i++) {
            option = this.options[i];
            option.setChecked(option.getValue() === value, true);
        }
        return this;
    }

    doGetValue(): string {
        let option;
        for (let i = 0; i < this.options.length; i++) {
            option = this.options[i];
            if (option.isChecked()) {
                return option.getValue();
            }
        }
        return undefined;
    }

    setDisabled(disabled: boolean) {
        this.options.forEach((option: RadioButton) => option.setDisabled(disabled));
    }

    giveFocus(): boolean {
        return this.options.length < 1 ? false : this.options[0].giveFocus();
    }
}
