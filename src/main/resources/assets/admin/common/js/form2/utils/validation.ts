import type {Occurrences} from '../../form/Occurrences';
import type {FormValidationNode, FormValidationResult} from '../descriptor/FormValidationResult';
import type {OccurrenceValidationState} from '../descriptor/OccurrenceManager';
import type {ValidationResult} from '../descriptor/ValidationResult';

/** Translation function signature matching useI18n(). */
export type TranslateFn = (key: string, ...args: unknown[]) => string;

/** Extract first error message from validation results. */
export function getFirstError(errors: ValidationResult[]): string | undefined {
    return errors.at(0)?.message ?? undefined;
}

/**
 * Derive an occurrence-level error message from validation state.
 *
 * Returns `undefined` when per-value field errors exist (they take
 * priority) or when occurrence counts are within bounds.
 */
export function getOccurrenceErrorMessage(
    occurrences: Occurrences,
    validation: OccurrenceValidationState[],
    t: TranslateFn,
): string | undefined {
    const hasFieldErrors = validation.some(entry => entry.validationResults.length > 0);
    if (hasFieldErrors) return undefined;

    const totalValid = validation.filter(entry => !entry.breaksRequired && entry.validationResults.length === 0).length;
    const min = occurrences.getMinimum();
    const max = occurrences.getMaximum();

    if (occurrences.minimumBreached(totalValid)) {
        return min >= 1 && max !== 1 ? t('field.occurrence.breaks.min', min) : t('field.value.required');
    }

    if (occurrences.maximumBreached(totalValid)) {
        return max > 1 ? t('field.occurrence.breaks.max.many', max) : t('field.occurrence.breaks.max.one');
    }

    return undefined;
}

function search(nodes: FormValidationNode[], path: string): FormValidationNode | undefined {
    for (const node of nodes) {
        if (node.path === path) return node;
        if (node.type === 'fieldset') {
            const found = search(node.children, path);
            if (found != null) return found;
        }
    }
    return undefined;
}

/** Find a validation node by its form-item path (e.g. `'myInput'` or `'fs.nested'`). */
export function findByPath(result: FormValidationResult, path: string): FormValidationNode | undefined {
    return search(result.children, path);
}
