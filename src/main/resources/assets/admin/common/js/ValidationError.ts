import { ValidationErrorJson } from './ValidationErrorJson';

export type ValidationErrorType =
    | 'generalError'
    | 'dataError'
    | 'attachmentError'
    | 'siteConfigError'
    | 'mixinConfigError'
    | 'componentConfigError';

//
// * ValidationError
//

export class ValidationError {

    private readonly errorCode: string;

    private readonly message: string;

    constructor(builder: ValidationErrorBuilder) {
        this.errorCode = builder.errorCode;
        this.message = builder.message;
    }

    getErrorCode(): string {
        return this.errorCode;
    }

    getMessage(): string {
        return this.message;
    }

    getPropertyPath(): string | null {
        return null;
    }

    getAttachment(): string | null {
        return null;
    }

    static create(): ValidationErrorBuilder {
        return new ValidationErrorBuilder();
    }

    static fromJson(json: ValidationErrorJson): ValidationError {
        return new ValidationErrorBuilder().fromJson(json).build();
    }
}

//
// * DataValidationError
//

export class DataValidationError extends ValidationError {

    private readonly propertyPath: string;

    constructor(builder: ValidationErrorBuilder) {
        super(builder);
        this.propertyPath = builder.propertyPath;
    }

    override getPropertyPath(): string {
        return this.propertyPath;
    }
}

//
// * SiteConfigValidationError
//

export class SiteConfigValidationError extends DataValidationError {

    private readonly applicationKey: string;

    constructor(builder: ValidationErrorBuilder) {
        super(builder);
        this.applicationKey = builder.applicationKey;
    }

    getApplicationKey(): string {
        return this.applicationKey;
    }
}

//
// * MixinConfigValidationError
//

export class MixinConfigValidationError extends DataValidationError {

    private readonly mixinName: string;

    constructor(builder: ValidationErrorBuilder) {
        super(builder);
        this.mixinName = builder.mixinName;
    }

    getMixinName(): string {
        return this.mixinName;
    }
}

//
// * ComponentConfigValidationError
//

export class ComponentConfigValidationError extends DataValidationError {

    private readonly applicationKey: string;

    private readonly componentPath: string;

    constructor(builder: ValidationErrorBuilder) {
        super(builder);
        this.applicationKey = builder.applicationKey;
        this.componentPath = builder.componentPath;
    }

    getApplicationKey(): string {
        return this.applicationKey;
    }

    getComponentPath(): string {
        return this.componentPath;
    }
}

//
// * AttachmentValidationError
//

export class AttachmentValidationError extends ValidationError {

    private readonly attachment: string;

    constructor(builder: ValidationErrorBuilder) {
        super(builder);
        this.attachment = builder.attachment;
    }

    override getAttachment(): string {
        return this.attachment;
    }
}

//
// * ValidationErrorBuilder
//

export class ValidationErrorBuilder {

    attachment: string;

    applicationKey: string;

    componentPath: string;

    errorCode: string;

    message: string;

    mixinName: string;

    propertyPath: string;

    type: ValidationErrorType;

    fromJson(json: ValidationErrorJson): ValidationErrorBuilder {
        this.attachment = json.attachment;
        this.applicationKey = json.applicationKey;
        this.componentPath = json.componentPath;
        this.errorCode = json.errorCode;
        this.message = json.message;
        this.mixinName = json.mixinName;
        this.propertyPath = json.propertyPath;
        this.type = json.type as ValidationErrorType;

        return this;
    }

    setAttachment(value: string): ValidationErrorBuilder {
        this.attachment = value;
        return this;
    }

    setApplicationKey(value: string): ValidationErrorBuilder {
        this.applicationKey = value;
        return this;
    }

    setComponentPath(value: string): ValidationErrorBuilder {
        this.componentPath = value;
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

    setMixinName(value: string): ValidationErrorBuilder {
        this.mixinName = value;
        return this;
    }

    setPropertyPath(value: string): ValidationErrorBuilder {
        this.propertyPath = value;
        return this;
    }

    build(): ValidationError {
        if (this.type) {
            switch (this.type) {
                case 'componentConfigError':
                    return new ComponentConfigValidationError(this);
                case 'siteConfigError':
                    return new SiteConfigValidationError(this);
                case 'mixinConfigError':
                    return new MixinConfigValidationError(this);
                case 'dataError':
                    return new DataValidationError(this);
                case 'attachmentError':
                    return new AttachmentValidationError(this);
                default:
                    return new ValidationError(this);
            }
        }

        // Infer type from fields when not explicitly set
        if (this.componentPath) {
            return new ComponentConfigValidationError(this);
        }
        if (this.mixinName) {
            return new MixinConfigValidationError(this);
        }
        if (this.applicationKey && this.propertyPath) {
            return new SiteConfigValidationError(this);
        }
        if (this.propertyPath) {
            return new DataValidationError(this);
        }
        if (this.attachment) {
            return new AttachmentValidationError(this);
        }

        return new ValidationError(this);
    }
}
