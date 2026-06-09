import type {OccurrenceValidationState} from '../descriptor/OccurrenceManager';
import type {ValidationResult} from '../descriptor/ValidationResult';

export type ServerErrorEntryLike = {
    path: string;
    message: string;
};

export function matchesFieldPath(serverPath: string, fieldPath: string): boolean {
    return serverPath === fieldPath || serverPath.startsWith(`${fieldPath}.`) || serverPath.startsWith(`${fieldPath}[`);
}

export function matchesOccurrencePath(serverPath: string, occurrencePath: string): boolean {
    return serverPath === occurrencePath || serverPath.startsWith(`${occurrencePath}.`);
}

export function serverErrorOccurrenceIndex(serverPath: string, fieldPath: string): number {
    if (serverPath.startsWith(`${fieldPath}[`)) {
        const rest = serverPath.slice(fieldPath.length + 1);
        const end = rest.indexOf(']');
        const index = end > 0 ? Number.parseInt(rest.slice(0, end), 10) : Number.NaN;
        return Number.isNaN(index) ? 0 : index;
    }
    return 0;
}

export function bucketServerErrorsByOccurrence(
    entries: readonly ServerErrorEntryLike[],
    fieldPath: string,
): Map<number, ValidationResult[]> {
    const byOccurrence = new Map<number, ValidationResult[]>();
    for (const entry of entries) {
        if (!matchesFieldPath(entry.path, fieldPath)) continue;
        const occurrence = serverErrorOccurrenceIndex(entry.path, fieldPath);
        const results = byOccurrence.get(occurrence) ?? [];
        results.push({message: entry.message, custom: true, server: true});
        byOccurrence.set(occurrence, results);
    }
    return byOccurrence;
}

export function mergeServerErrors(
    validation: OccurrenceValidationState[],
    serverErrorsByOccurrence: Map<number, ValidationResult[]>,
): OccurrenceValidationState[] {
    if (serverErrorsByOccurrence.size === 0) return validation;
    if (validation.length === 0) {
        const all = [...serverErrorsByOccurrence.values()].flat();
        return [{index: 0, breaksRequired: false, validationResults: all}];
    }

    const overflow: ValidationResult[] = [];
    serverErrorsByOccurrence.forEach((results, index) => {
        if (index >= validation.length) overflow.push(...results);
    });

    return validation.map((entry, index) => {
        const extra = [...(serverErrorsByOccurrence.get(index) ?? []), ...(index === 0 ? overflow : [])];
        return extra.length > 0 ? {...entry, validationResults: [...extra, ...entry.validationResults]} : entry;
    });
}
