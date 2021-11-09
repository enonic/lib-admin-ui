import {ValidationError} from './ValidationError';

export class ValidationErrorHelper {

    private static SYSTEM: string = 'system:';

    static isCustomError(error: ValidationError): boolean {
        return !ValidationErrorHelper.isCommonError(error);
    }

    static isCommonError(error: ValidationError): boolean {
        return error.getErrorCode()?.indexOf(ValidationErrorHelper.SYSTEM) === 0;
    }
}
