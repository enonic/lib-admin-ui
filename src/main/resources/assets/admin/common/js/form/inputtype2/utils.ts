import type {ValidationResult} from './descriptor/ValidationResult';

/** Extract first error message from validation results. */
export function getFirstError(errors: ValidationResult[]): string | undefined {
    return errors.length > 0 ? errors[0].message : undefined;
}
