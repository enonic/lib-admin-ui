import {FormInputEl} from '../dom/FormInputEl';
import {InputEl} from '../dom/InputEl';
import {LabelEl} from '../dom/LabelEl';

export class Checkbox
    extends FormInputEl {
    //TODO: USE HTML CHECKED PROPERTY INSTEAD OF ATTRIBUTE CHECKED! from ljl

    public static debug: boolean = false;
    private checkbox: InputEl;
    private label: LabelEl;

    constructor(builder: CheckboxBuilder) {
        const {name, inputAlignment, text, tooltip, checked} = builder;

        super('div', 'checkbox', undefined, String(checked || false));

        this.initCheckbox(inputAlignment);
        this.initLabel(text, tooltip);

        this.onApplyKeyPressed(() => {
            this.toggleChecked();
            this.getEl().dispatchEvent('change');
        });

        if (name) {
            this.setName(name);
        }

        this.appendChild(this.checkbox);
        this.appendChild(this.label);
        this.setChecked(checked || false, true);
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

    clear(): void {
        this.setChecked(false);
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
        super.setValue(value);
        return this;
    }

    getValue(): string {
        if (Checkbox.debug) {
            console.warn('Checkbox.getValue gets the value attribute, you may have wanted to use getChecked instead');
        }
        return super.getValue();
    }

    giveFocus(): boolean {
        return this.checkbox.giveFocus();
    }

    giveBlur(): boolean {
        return this.checkbox.giveBlur();
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
        this.checkbox.setPlaceholder(value);
        return this;
    }

    getPlaceholder(): string {
        return this.checkbox.getPlaceholder();
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

    private initCheckbox(inputAlignment: InputAlignment) {
        this.checkbox = new InputEl('', 'checkbox');
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
}

export enum InputAlignment {
    TOP,
    RIGHT,
    LEFT,
    BOTTOM
}

export class CheckboxBuilder {
    name: string;

    text: string;

    checked: boolean;

    inputAlignment: InputAlignment;

    tooltip: string;

    setName(name: string): this {
        this.name = name;
        return this;
    }

    setLabelText(value: string): this {
        this.text = value;
        return this;
    }

    setTooltip(value: string): this {
        this.tooltip = value;
        return this;
    }

    setChecked(value: boolean): this {
        this.checked = value;
        return this;
    }

    setInputAlignment(value: InputAlignment): this {
        this.inputAlignment = value;
        return this;
    }

    build(): Checkbox {
        return new Checkbox(this);
    }
}
