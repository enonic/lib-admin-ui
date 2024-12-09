import {PropertyPath} from '../data/PropertyPath';
import {InputTypeViewContext} from './inputtype/InputTypeViewContext';
import {Input} from './Input';
import {FormState} from '../app/wizard/WizardPanel';
import {ValidationError} from '../ValidationError';
import {AiTool} from '../ai/AiTool';

export class FormContext {

    private readonly name?: string;

    private showEmptyFormItemSetOccurrences: boolean;

    private formState: FormState;

    private language: string;

    private validationErrors: ValidationError[];

    private readonly aiTools: AiTool[];

    constructor(builder: FormContextBuilder) {
        this.name = builder.name;
        this.showEmptyFormItemSetOccurrences = builder.showEmptyFormItemSetOccurrences;
        this.formState = builder.formState;
        this.language = builder.language;
        this.validationErrors = builder.validationErrors || [];
        this.aiTools = builder.aiTools ?? [];
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

    getName(): string {
        return this.name;
    }

    getAiTools(): AiTool[] {
        return this.aiTools;
    }

}

export class FormContextBuilder {

    name: string;

    showEmptyFormItemSetOccurrences: boolean;

    formState: FormState;

    language: string;

    validationErrors: ValidationError[];

    aiTools: AiTool[];

    public setShowEmptyFormItemSetOccurrences(value: boolean): this {
        this.showEmptyFormItemSetOccurrences = value;
        return this;
    }

    public setName(value: string): this {
        this.name = value;
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

    public setAiTools(value: AiTool[]): this {
        this.aiTools = value;
        return this;
    }

    public build(): FormContext {
        return new FormContext(this);
    }
}
