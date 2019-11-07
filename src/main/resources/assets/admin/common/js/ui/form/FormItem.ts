import {DivEl} from '../../dom/DivEl';
import {LabelEl} from '../../dom/LabelEl';
import {FormItemEl} from '../../dom/FormItemEl';
import {SpanEl} from '../../dom/SpanEl';
import {StringHelper} from '../../util/StringHelper';
import {FormInputEl} from '../../dom/FormInputEl';
import {Validators} from './Validators';
import {ValidationError, ValidationResult} from './ValidationResult';
import {ValidityChangedEvent} from '../../ValidityChangedEvent';

export class FormItem
    extends DivEl {

    static INVALID_CLASS: string = 'invalid';

    private label: LabelEl;
    private input: FormItemEl;
    private error: SpanEl;
    private validator: (input: FormItemEl) => string;

    private focusListeners: { (event: FocusEvent): void }[] = [];

    private blurListeners: { (event: FocusEvent): void }[] = [];

    constructor(builder: FormItemBuilder) {
        super('input-view');
        this.error = new SpanEl('error');
        this.appendChild(this.error);

        this.input = builder.getInput();
        this.input.onFocus((event: FocusEvent) => {
            this.notifyFocused(event);
        });

        this.input.onBlur((event: FocusEvent) => {
            this.notifyBlurred(event);
        });

        if (builder.getLabel()) {
            this.label = new LabelEl(builder.getLabel(), this.input);
            if (Validators.required === builder.getValidator()) {
                this.label.addClass('required');
            }
            this.appendChild(this.label);
        }
        this.appendChild(this.input);

        if (builder.getValidator()) {
            this.validator = builder.getValidator();
        }
    }

    setLabel(value: string) {
        if (this.label) {
            this.label.setValue(value);
        }
    }

    getLabel(): LabelEl {
        return this.label;
    }

    getInput(): FormItemEl {
        return this.input;
    }

    getValidator(): (input: FormItemEl) => string {
        return this.validator;
    }

    removeValidator() {
        if (this.validator) {
            this.validator = null;
        }
    }

    setValidator(value: (input: FormItemEl) => string) {
        this.validator = value;
    }

    validate(validationResult: ValidationResult, markInvalid?: boolean) {
        if (this.validator) {
            let validationMessage = this.validator(this.input);

            if (validationMessage) {
                validationResult.addError(new ValidationError(this, validationMessage));
            }
            if (markInvalid) {
                let validityChanged = false;
                if (validationMessage) {
                    this.addClass(FormItem.INVALID_CLASS);
                    validityChanged = (validationMessage !== this.getError());
                } else {
                    this.removeClass(FormItem.INVALID_CLASS);
                    validityChanged = !StringHelper.isBlank(this.getError());
                }
                this.error.setHtml(validationMessage || StringHelper.EMPTY_STRING);
                if (validityChanged) {
                    this.notifyValidityChanged(StringHelper.isBlank(validationMessage));
                }
            }
        }
    }

    getError(): string {
        return this.error.getHtml();
    }

    onValidityChanged(listener: (event: ValidityChangedEvent) => void) {
        this.input.onValidityChanged(listener);
    }

    unValidityChanged(listener: (event: ValidityChangedEvent) => void) {
        this.input.unValidityChanged(listener);
    }

    notifyValidityChanged(valid: boolean) {
        this.input.notifyValidityChanged(valid);
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

export class FormItemBuilder {

    private label: string;
    private validator: (el: FormInputEl) => string;
    private input: FormItemEl;

    constructor(input: FormItemEl) {
        if (!input) {
            throw new Error(`Input can't be null.`);
        }
        this.input = input;
    }

    build() {
        return new FormItem(this);
    }

    getInput(): FormItemEl {
        return this.input;
    }

    setLabel(label: string): FormItemBuilder {
        this.label = label;
        return this;
    }

    getLabel(): string {
        return this.label;
    }

    setValidator(validator: (input: FormInputEl) => string): FormItemBuilder {
        this.validator = validator;
        return this;
    }

    getValidator(): (input: FormInputEl) => string {
        return this.validator;
    }

}
