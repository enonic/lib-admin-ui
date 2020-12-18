import {FormInputEl} from '../dom/FormInputEl';
import {InputEl} from '../dom/InputEl';
import {LabelEl} from '../dom/LabelEl';
import {Element, NewElementBuilder} from '../dom/Element';

export class Checkbox
    extends FormInputEl {
    //TODO: USE HTML CHECKED PROPERTY INSTEAD OF ATTRIBUTE CHECKED! from ljl

    public static debug: boolean = false;
    private checkbox: InputEl;
    private label: LabelEl;

    constructor(builder: CheckboxBuilder) {
        super('div', 'checkbox', undefined, String(builder.checked || false));

        this.initCheckbox(builder.inputAlignment);
        this.initLabel(builder.text, builder.tooltip);

        this.appendChild(this.checkbox);
        this.appendChild(this.label);
    }

    static create(): CheckboxBuilder {
        return new CheckboxBuilder();
    }

    isDisabled(): boolean {
        return this.checkbox.getEl().isDisabled();
    }

    setChecked(newValue: boolean, silent?: boolean): Checkbox {
        super.setValue(String(newValue), silent);
        return this;
    }

    isChecked(): boolean {
        return super.getValue() === 'true';
    }

    toggleChecked() {
        this.setChecked(!this.isChecked());
    }

    setValue(value: string): Checkbox {
        if (Checkbox.debug) {
            console.warn('Checkbox.setValue sets the value attribute, you may have wanted to use setChecked instead');
        }
        this.getEl().setValue(value);
        return this;
    }

    getValue(): string {
        if (Checkbox.debug) {
            console.warn('Checkbox.getValue gets the value attribute, you may have wanted to use getChecked instead');
        }
        return this.getEl().getValue();
    }

    giveFocus(): boolean {
        return this.checkbox.giveFocus();
    }

    giveBlur(): boolean {
        return this.checkbox.giveBlur();
    }

    setName(value: string): Checkbox {
        this.checkbox.setName(value);
        return this;
    }

    setPartial(value: boolean) {
        this.checkbox.toggleClass('partial', value);
    }

    isPartial(): boolean {
        return this.checkbox.hasClass('partial');
    }

    setEnabled(enable: boolean) {
        super.setEnabled(enable);
        this.checkbox.getEl().setDisabled(!enable);
    }

    setLabel(text: string): Checkbox {
        this.label.setValue(text);
        return this;
    }

    getLabel(): string {
        return this.label.getValue();
    }

    setPlaceholder(value: string): Checkbox {
        this.checkbox.getEl().setAttribute('placeholder', value);
        return this;
    }

    getPlaceholder(): string {
        return this.checkbox.getEl().getAttribute('placeholder');
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.checkbox.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.checkbox.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.checkbox.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.checkbox.unBlur(listener);
    }

    protected doSetValue(value: string) {
        if (Checkbox.debug) {
            console.debug('Checkbox.doSetValue: ', value);
        }
        this.checkbox.getHTMLElement()['checked'] = value === 'true';
    }

    protected doGetValue(): string {
        return String(this.checkbox.getHTMLElement()['checked']);
    }

    private initCheckbox(inputAlignment: InputAlignment) {            // we need an id for the label to interact nicely
        // we need an id for the label to interact nicely
        this.checkbox = <InputEl> new Element(new NewElementBuilder().setTagName('input').setGenerateId(true));
        this.checkbox.getEl().setAttribute('type', 'checkbox');
        this.addClass(this.getInputAlignmentAsString(inputAlignment));
    }

    private initLabel(text: string, tooltip?: string) {
        this.label = new LabelEl(text, this.checkbox);
        if (tooltip) {
            this.label.setTitle(tooltip);
        }
    }

    private getInputAlignmentAsString(inputAlignment: InputAlignment = InputAlignment.LEFT): string {

        return InputAlignment[inputAlignment].toLowerCase();
    }

    /* TODO: DEPRECATE METHODS BELOW IN 4.0 */

    setDisabled(value: boolean) {
        console.warn(`Checkbox.setDisabled() is deprecated and will be removed in lib-admin-ui 4.0.0`);
        this.setEnabled(!value);
        return this;
    }
}

export enum InputAlignment {
    TOP,
    RIGHT,
    LEFT,
    BOTTOM
}

export class CheckboxBuilder {
    text: string;

    checked: boolean;

    inputAlignment: InputAlignment;

    tooltip: string;

    setLabelText(value: string): CheckboxBuilder {
        this.text = value;
        return this;
    }

    setTooltip(value: string): CheckboxBuilder {
        this.tooltip = value;
        return this;
    }

    setChecked(value: boolean): CheckboxBuilder {
        this.checked = value;
        return this;
    }

    setInputAlignment(value: InputAlignment): CheckboxBuilder {
        this.inputAlignment = value;
        return this;
    }

    build(): Checkbox {
        return new Checkbox(this);
    }
}
