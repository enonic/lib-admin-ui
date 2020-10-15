import {PropertyPath} from '../data/PropertyPath';
import {InputTypeViewContext} from './inputtype/InputTypeViewContext';
import {Input} from './Input';
import {FormState} from '../app/wizard/WizardPanel';

export class FormContext {

    private showEmptyFormItemSetOccurrences: boolean;

    private formState: FormState;

    constructor(builder: FormContextBuilder) {
        this.showEmptyFormItemSetOccurrences = builder.showEmptyFormItemSetOccurrences;
        this.formState = builder.formState;
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

        return <InputTypeViewContext> {
            formContext: this,
            input: input,
            inputConfig: inputTypeConfig,
            parentDataPath: parentPropertyPath
        };
    }

    getFormState(): FormState {
        return this.formState;
    }
}

export class FormContextBuilder {

    showEmptyFormItemSetOccurrences: boolean;

    formState: FormState;

    public setShowEmptyFormItemSetOccurrences(value: boolean): FormContextBuilder {
        this.showEmptyFormItemSetOccurrences = value;
        return this;
    }

    public setFormState(value: FormState): FormContextBuilder {
        this.formState = value;
        return this;
    }

    public build(): FormContext {
        return new FormContext(this);
    }
}
