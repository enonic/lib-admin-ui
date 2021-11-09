import {ValidationErrorJson} from './ValidationErrorJson';

export class ValidationError {

    private readonly attachment: string;

    private readonly errorCode: string;

    private readonly message: string;

    private readonly propertyPath: string;

    constructor(builder: ValidationErrorBuilder) {
        this.attachment = builder.attachment;
        this.errorCode = builder.errorCode;
        this.message = builder.message;
        this.propertyPath = builder.propertyPath;
    }

    getAttachment(): string {
        return this.attachment;
    }

    getErrorCode(): string {
        return this.errorCode;
    }

    getMessage(): string {
        return this.message;
    }

    getPropertyPath(): string {
        return this.propertyPath;
    }

    static create(): ValidationErrorBuilder {
        return new ValidationErrorBuilder();
    }

    static fromJson(json: ValidationErrorJson): ValidationError {
        return new ValidationErrorBuilder().fromJson(json).build();
    }
}

export class ValidationErrorBuilder {

    attachment: string;

    errorCode: string;

    message: string;

    propertyPath: string;

    fromJson(json: ValidationErrorJson): ValidationErrorBuilder {
        this.attachment = json.attachment;
        this.errorCode = json.errorCode;
        this.message = json.message;
        this.propertyPath = json.propertyPath;

        return this;
    }

    setAttachment(value: string): ValidationErrorBuilder {
        this.attachment = value;
        return this;
    }

    setErrorCode(value: string): ValidationErrorBuilder {
        this.errorCode = value;
        return this;
    }

    setMessage(value: string): ValidationErrorBuilder {
        this.message = value;
        return this;
    }

    setPropertyPath(value: string): ValidationErrorBuilder {
        this.propertyPath = value;
        return this;
    }

    build(): ValidationError {
        return new ValidationError(this);
    }
}
