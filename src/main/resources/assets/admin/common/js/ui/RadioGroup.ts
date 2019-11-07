import * as $ from 'jquery';
import {FormInputEl} from '../dom/FormInputEl';
import {ElementRegistry} from '../dom/ElementRegistry';
import {InputEl} from '../dom/InputEl';
import {LabelEl} from '../dom/LabelEl';

export enum RadioOrientation {
    VERTICAL,
    HORIZONTAL
}

export class RadioGroup
    extends FormInputEl {

    // Group name is similar to name, but have and addition counter
    // to prevent inappropriate behaviour of the radio group on one page
    // with the same names
    private groupName: string;

    private options: RadioButton[] = [];

    constructor(name: string, originalValue?: string) {
        super('div', 'radio-group', undefined, originalValue);
        this.setName(name);
        this.groupName = `${name}-${ElementRegistry.getElementCountById(this.getId())}`;
    }

    public setOrientation(orientation: RadioOrientation): RadioGroup {
        this.toggleClass('vertical', orientation === RadioOrientation.VERTICAL);
        return this;
    }

    public addOption(value: string, label: string) {
        let checked = value === this.getOriginalValue();
        let radio = new RadioButton(label, value, this.groupName, checked);

        radio.onValueChanged(() => this.setValue(this.doGetValue(), false, true));
        this.options.push(radio);
        this.appendChild(radio);
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

    giveFocus(): boolean {
        return this.options.length < 1 ? false : this.options[0].giveFocus();
    }

}

export class RadioButton
    extends FormInputEl {

    public static debug: boolean = false;
    private radio: InputEl;
    private label: LabelEl;

    constructor(label: string, value: string, name: string, checked?: boolean) {
        super('span', 'radio-button', undefined, String(checked != null ? checked : false));

        this.radio = new InputEl();
        this.radio.getEl().setAttribute('type', 'radio');
        this.radio.setName(name).setValue(value);
        this.appendChild(this.radio);

        this.label = new LabelEl(label, this.radio);
        this.appendChild(this.label);

        $(this.radio.getHTMLElement()).on('change', () => {
            this.refreshDirtyState();
            this.refreshValueChanged();
        });
    }

    setValue(value: string): RadioButton {
        if (RadioButton.debug) {
            console.warn('RadioButton.setValue sets the value attribute, you may have wanted to use setChecked instead');
        }
        this.radio.setValue(value);
        return this;
    }

    getValue(): string {
        if (RadioButton.debug) {
            console.warn('RadioButton.getValue gets the value attribute, you may have wanted to use isChecked instead');
        }
        return this.radio.getValue();
    }

    setLabel(text: string): RadioButton {
        this.label.setValue(text);
        return this;
    }

    getLabel(): string {
        return this.label.getValue();
    }

    getName(): string {
        return this.radio.getName();
    }

    public isChecked(): boolean {
        return super.getValue() === 'true';
    }

    public setChecked(checked: boolean, silent?: boolean): RadioButton {
        super.setValue(String(checked), silent);
        return this;
    }

    giveFocus(): boolean {
        return this.radio.giveFocus();
    }

    protected doSetValue(value: string) {
        if (RadioButton.debug) {
            console.warn('RadioButton.doSetValue', value);
        }
        this.radio.getHTMLElement()['checked'] = value === 'true';
    }

    protected doGetValue(): string {
        return String(this.radio.getHTMLElement()['checked']);
    }

}
