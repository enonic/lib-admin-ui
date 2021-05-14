import {PropertyPath} from '../data/PropertyPath';
import {InputTypeViewContext} from './inputtype/InputTypeViewContext';
import {Input} from './Input';
import {FormState} from '../app/wizard/WizardPanel';

export class FormContext {

    private showEmptyFormItemSetOccurrences: boolean;

    private formState: FormState;

    private language: string;

    constructor(builder: FormContextBuilder) {
        this.showEmptyFormItemSetOccurrences = builder.showEmptyFormItemSetOccurrences;
        this.formState = builder.formState;
        this.language = builder.language;
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

        return <InputTypeViewContext>{
            formContext: this,
            input: input,
            inputConfig: inputTypeConfig,
            parentDataPath: parentPropertyPath
        };
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

    setLanguage(lang: string) {
        this.language = lang;
    }
}

export class FormContextBuilder {

    showEmptyFormItemSetOccurrences: boolean;

    formState: FormState;

    language: string;

    public setShowEmptyFormItemSetOccurrences(value: boolean): FormContextBuilder {
        this.showEmptyFormItemSetOccurrences = value;
        return this;
    }

    public setFormState(value: FormState): FormContextBuilder {
        this.formState = value;
        return this;
    }

    public setLanguage(lang: string): FormContextBuilder {
        this.language = lang;
        return this;
    }

    public build(): FormContext {
        return new FormContext(this);
    }
}
