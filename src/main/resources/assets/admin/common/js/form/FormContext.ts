import {PropertyPath} from '../data/PropertyPath';
import {InputTypeViewContext} from './inputtype/InputTypeViewContext';
import {Input} from './Input';
import {FormState} from '../app/wizard/WizardPanel';
import {ValidationError} from '../ValidationError';

export class FormContext {

    private showEmptyFormItemSetOccurrences: boolean;

    private formState: FormState;

    private language: string;

    private validationErrors: ValidationError[];

    private readonly aiEditable: boolean;

    constructor(builder: FormContextBuilder) {
        this.showEmptyFormItemSetOccurrences = builder.showEmptyFormItemSetOccurrences;
        this.formState = builder.formState;
        this.language = builder.language;
        this.validationErrors = builder.validationErrors || [];
        this.aiEditable = builder.aiEditable ?? false;
    }

    static create(): FormContextBuilder {
        return new FormContextBuilder();
    }

    getShowEmptyFormItemSetOccurrences(): boolean {
        return this.showEmptyFormItemSetOccurrences;
    }

    setShowEmptyFormItemSetOccurrences(value: boolean) {
        this.showEmptyFormItemSetOccurrences = value;
    }

    createInputTypeViewContext(inputTypeConfig: any, parentPropertyPath: PropertyPath,
                               input: Input): InputTypeViewContext {

        return {
            formContext: this,
            input: input,
            inputConfig: inputTypeConfig,
            parentDataPath: parentPropertyPath
        } as InputTypeViewContext;
    }

    getFormState(): FormState {
        return this.formState;
    }

    setFormState(formState: FormState) {
        this.formState = formState;
    }

    getLanguage(): string {
        return this.language;
    }

    hasValidationErrors(): boolean {
        return this.validationErrors?.length > 0;
    }

    setValidationErrors(validationErrors: ValidationError[]): void {
        this.validationErrors = validationErrors;
    }

    getValidationErrors(): ValidationError[] {
        return this.validationErrors.slice(0);
    }

    setLanguage(lang: string) {
        this.language = lang;
    }

    isAiEditable(): boolean {
        return this.aiEditable;
    }

}

export class FormContextBuilder {

    showEmptyFormItemSetOccurrences: boolean;

    formState: FormState;

    language: string;

    validationErrors: ValidationError[];

    aiEditable: boolean;

    public setShowEmptyFormItemSetOccurrences(value: boolean): this {
        this.showEmptyFormItemSetOccurrences = value;
        return this;
    }

    public setFormState(value: FormState): this {
        this.formState = value;
        return this;
    }

    public setLanguage(lang: string): this {
        this.language = lang;
        return this;
    }

    public setValidationErrors(value: ValidationError[]): this {
        this.validationErrors = value;
        return this;
    }

    public setAiEditable(value: boolean): this {
        this.aiEditable = value;
        return this;
    }

    public build(): FormContext {
        return new FormContext(this);
    }
}
