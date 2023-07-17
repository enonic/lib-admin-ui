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
        for (const option of this.options) {
            option.setChecked(option.getValue() === value, true);
        }
        return this;
    }

    doGetValue(): string {
        let option;
        for (const option of this.options) {
            if (option.isChecked()) {
                return option.getValue();
            }
        }
        return undefined;
    }

    setEnabled(enable: boolean) {
        super.setEnabled(enable);

        this.options.forEach((option: RadioButton) => option.setEnabled(enable));
    }

    giveFocus(): boolean {
        return this.options.length < 1 ? false : this.options[0].giveFocus();
    }

    public resetBaseValues(): void {
        super.resetBaseValues();
        this.options.forEach(o => o.resetBaseValues());
    }

    clear(): void {
        this.options.forEach((o: RadioButton) => o.clear());
    }

    /* TODO: DEPRECATE METHODS BELOW IN 4.0 */

    setDisabled(disabled: boolean) {
        console.warn('RadioGroup.setDisabled() is deprecated and will be removed in lib-admin-ui 4.0.0');
        this.setEnabled(!disabled);
    }
}
