import {FormInputEl} from './FormInputEl';

export class InputEl
    extends FormInputEl {

    constructor(className?: string, type?: string, prefix?: string, originalValue?: string) {
        super('input', className, prefix, originalValue);
        this.setType(type || 'text');

        this.setAutocomplete(false);

        this.onInput(this.handleInput.bind(this));
    }

    getName(): string {
        return this.getEl().getAttribute('name');
    }

    setName(value: string): InputEl {
        this.getEl().setAttribute('name', value);
        return this;
    }

    getType(): string {
        return this.getEl().getAttribute('type');
    }

    setType(type: string): InputEl {
        this.getEl().setAttribute('type', type);
        return this;
    }

    setPlaceholder(value: string): InputEl {
        this.getEl().setAttribute('placeholder', value);
        return this;
    }

    getPlaceholder(): string {
        return this.getEl().getAttribute('placeholder');
    }

    setAutocomplete(value: boolean): InputEl {
        this.getEl().setAutocomplete(value);
        return this;
    }

    hasAutocomplete(): boolean {
        return this.getEl().hasAutocomplete();
    }

    getPattern(): string {
        return this.getEl().getAttribute('pattern');
    }

    setPattern(pattern: string): InputEl {
        this.getEl().setAttribute('pattern', pattern);
        return this;
    }

    reset() {
        this.getEl().setValue('');
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Forms_in_HTML
     * @returns {boolean}
     */
    isValid(): boolean {
        let validity: ValidityState = (this.getHTMLElement() as HTMLInputElement).validity;
        return validity && validity.valid;
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Forms_in_HTML
     * @returns {boolean}
     */
    validate(): boolean {
        return (this.getHTMLElement() as HTMLInputElement).checkValidity();
    }

    setRequired(required: boolean): InputEl {
        if (required) {
            this.getEl().setAttribute('required', 'required');
        } else {
            this.getEl().removeAttribute('required');
        }
        return this;
    }

    isRequired(): boolean {
        return this.getEl().hasAttribute('required');
    }

    protected handleInput() {
        this.refreshDirtyState();
        this.refreshValueChanged();
    }

    setEnabled(enable: boolean) {
        super.setEnabled(enable);
        this.getEl().setDisabled(!enable);

        if (enable) {
            this.getEl().removeAttribute('disabled');
        } else {
            this.getEl().setAttribute('disabled', 'disabled');
        }
    }
}
