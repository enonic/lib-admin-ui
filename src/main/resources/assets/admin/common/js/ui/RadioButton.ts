import {Element} from '../dom/Element';
import {FormInputEl} from '../dom/FormInputEl';
import {InputEl} from '../dom/InputEl';
import {LabelEl} from '../dom/LabelEl';
import {ObjectHelper} from '../ObjectHelper';

export type RadioButtonLabel = LabelEl | string;

export class RadioButtonConfig {
    label: RadioButtonLabel;
    value: string;
    name: string;
    checked?: boolean;
    tooltip?: string;
}

export class RadioButton
    extends FormInputEl {

    public static debug: boolean = false;

    protected radio: InputEl;

    protected label: LabelEl;

    constructor(config: RadioButtonConfig) {
        const originalValue = String(config.checked != null ? config.checked : false);
        super('span', 'radio-button', undefined, originalValue);

        this.initElements(config);
    }

    protected initElements(config: RadioButtonConfig): void {
        this.radio = this.createRadio(config);
        this.label = this.createLabel(config, this.radio);
        this.appendChildren<Element>(this.radio, this.label);
    }

    protected createRadio(config: RadioButtonConfig): InputEl {
        const {name, value} = config;
        const radio = new InputEl();
        radio.getEl().setAttribute('type', 'radio');
        radio.setName(name).setValue(value);
        return radio;
    }

    protected createLabel(config: RadioButtonConfig, radio: InputEl): LabelEl {
        const {label} = config;
        let labelEl: LabelEl;

        if (ObjectHelper.iFrameSafeInstanceOf(label, LabelEl)) {
            labelEl = label as LabelEl;
            labelEl.setForElement(radio);
            return labelEl;
        }

        labelEl = new LabelEl(label as string, radio);
        if (config.tooltip) {
            labelEl.setTitle(config.tooltip);
        }

        return labelEl;
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

    getInput(): InputEl {
        return this.radio;
    }

    getName(): string {
        return this.radio.getName();
    }

    isChecked(): boolean {
        return super.getValue() === 'true';
    }

    setChecked(checked: boolean, silent?: boolean): RadioButton {
        super.setValue(String(checked), silent);
        return this;
    }

    setEnabled(enable: boolean) {
        super.setEnabled(enable);

        this.radio.setEnabled(enable);
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

    /* TODO: DEPRECATE METHODS BELOW IN 4.0 */

    setDisabled(disabled: boolean) {
        console.warn('RadioButton.setDisabled() is deprecated and will be removed in lib-admin-ui 4.0.0');
        this.setEnabled(!disabled);
    }

    clear(): void {
        this.setChecked(false);
    }
}
