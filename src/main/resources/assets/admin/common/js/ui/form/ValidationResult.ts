import {FormItem} from './FormItem';

export class ValidationResult {

    private valid: boolean = true;
    private errors: ValidationError[] = [];

    addError(error: ValidationError) {
        this.errors.push(error);
        if (this.valid) {
            this.valid = false;
        }
    }

    isValid(): boolean {
        return this.valid;
    }

    getErrors(): ValidationError[] {
        return this.errors;
    }

}

export class ValidationError {
    private formItem: FormItem;
    private message: string;

    constructor(formItem: FormItem, message?: string) {
        this.formItem = formItem;
        this.message = message;
    }

    getFormItem(): FormItem {
        return this.formItem;
    }

    getMessage(): string {
        return this.message;
    }
}
