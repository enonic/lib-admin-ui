import {DivEl} from '../../dom/DivEl';
import {LabelEl} from '../../dom/LabelEl';
import {FormItemEl} from '../../dom/FormItemEl';
import {StringHelper} from '../../util/StringHelper';
import {FormInputEl} from '../../dom/FormInputEl';
import {Validators} from './Validators';
import {ValidationError, ValidationResult} from './ValidationResult';
import {ValidityChangedEvent} from '../../ValidityChangedEvent';
import {ValidationRecordingViewer} from '../../form/ValidationRecordingViewer';

export class FormItem
    extends DivEl {

    static INVALID_CLASS: string = 'invalid';

    private label: LabelEl;
    private input: FormItemEl;
    private validator: (input: FormItemEl) => string;
    private validationMessage: string;

    private focusListeners: ((event: FocusEvent) => void)[] = [];

    private blurListeners: ((event: FocusEvent) => void)[] = [];

    constructor(builder: FormItemBuilder) {
        super('input-view');

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

            const validationRecordingViewer = new ValidationRecordingViewer();

            this.appendChild(validationRecordingViewer);
            this.onValidityChanged(() => validationRecordingViewer.setError(this.getError()));

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

        if (Validators.required === value) {
            this.label.addClass('required');
        }
    }

    validate(validationResult: ValidationResult, markInvalid?: boolean) {
        if (!this.validator) {
            return;
        }

        let validationMessage = this.validator(this.input);

        if (validationMessage) {
            validationResult.addError(new ValidationError(this, validationMessage));
        }
        let validityChanged;
        if (markInvalid) {
            if (validationMessage) {
                this.addClass(FormItem.INVALID_CLASS);
                validityChanged = (validationMessage !== this.getError());
            } else {
                this.removeClass(FormItem.INVALID_CLASS);
                validityChanged = !StringHelper.isBlank(this.getError());
            }
        }
        this.validationMessage = validationMessage;
        if (validityChanged) {
            this.notifyValidityChanged(StringHelper.isBlank(this.validationMessage));
        }
    }

    getError(): string {
        return this.validationMessage;
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
            throw new Error('Input can\'t be null.');
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
