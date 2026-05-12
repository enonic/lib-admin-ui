import type {Value} from '../../data/Value';
import type {Occurrences} from '../../form/Occurrences';
import type {InputTypeConfig} from './InputTypeConfig';
import type {InputTypeDescriptor} from './InputTypeDescriptor';
import type {ValidationResult} from './ValidationResult';

export type OccurrenceValidationState = {
    readonly index: number;
    readonly breaksRequired: boolean;
    readonly validationResults: ValidationResult[];
};

export type OccurrenceManagerState = {
    readonly ids: string[];
    readonly values: Value[];
    readonly occurrenceValidation: OccurrenceValidationState[];
    readonly totalValid: number;
    readonly isMinimumBreached: boolean;
    readonly isMaximumBreached: boolean;
    readonly isValid: boolean;
    readonly canAdd: boolean;
    readonly canRemove: boolean;
};

/**
 * Pure state manager for input occurrences.
 *
 * Manages add/remove/reorder of values and validates occurrence counts.
 * No DOM dependency — can be consumed by React hooks or legacy code.
 */
export class OccurrenceManager<C extends InputTypeConfig = InputTypeConfig> {
    private readonly occurrences: Occurrences;
    private readonly descriptor: InputTypeDescriptor<C>;
    private readonly config: C;
    private values: Value[];
    private rawValues: (string | undefined)[];
    private ids: string[];
    // Keyed by stable occurrence ID rather than position so async callers can capture
    // an ID and use it later without the entry following whatever happens to be at the
    // captured index after intervening moves/removes.
    private transientErrors: Map<string, string> = new Map();
    private nextId = 0;

    constructor(occurrences: Occurrences, descriptor: InputTypeDescriptor<C>, config: C, initialValues: Value[] = []) {
        this.occurrences = occurrences;
        this.descriptor = descriptor;
        this.config = config;
        this.values = [...initialValues];
        this.rawValues = initialValues.map(() => undefined);
        this.ids = this.values.map(() => this.generateId());
    }

    private generateId(): string {
        return `occurrence-${this.nextId++}`;
    }

    getValues(): Value[] {
        return [...this.values];
    }

    getIds(): string[] {
        return [...this.ids];
    }

    // ? No maximum enforcement — reflects external data as-is. Validation reports isMaximumBreached.
    setValues(values: Value[]): void {
        const oldIds = this.ids;
        const oldValues = this.values;
        const oldRawValues = this.rawValues;
        this.values = [...values];
        // ? Preserve rawValues when the value reference at that position hasn't changed,
        // ? so that sync cycles after direct set() calls don't wipe rawValues.
        this.rawValues = values.map((v, i) =>
            i < oldValues.length && oldValues[i] === v ? oldRawValues[i] : undefined,
        );
        this.ids = this.values.map((_, i) => (i < oldIds.length ? oldIds[i] : this.generateId()));
        // External value replacement invalidates any transient errors — the values they
        // were tied to no longer exist (or were replaced wholesale).
        this.transientErrors.clear();
    }

    getCount(): number {
        return this.values.length;
    }

    getOccurrences(): Occurrences {
        return this.occurrences;
    }

    add(value?: Value): boolean {
        if (this.isMaximumReached()) {
            return false;
        }

        this.values.push(value ?? this.descriptor.getValueType().newNullValue());
        this.rawValues.push(undefined);
        this.ids.push(this.generateId());
        // New occurrence has a fresh ID, so existing transient entries stay attached
        // to their original IDs — no bookkeeping needed.
        return true;
    }

    remove(index: number): boolean {
        if (index < 0 || index >= this.values.length) {
            return false;
        }

        const removedId = this.ids[index];
        this.values.splice(index, 1);
        this.rawValues.splice(index, 1);
        this.ids.splice(index, 1);
        // Only drop the transient for the removed occurrence. Surviving occurrences
        // keep their entries because they keep their IDs.
        this.transientErrors.delete(removedId);
        return true;
    }

    move(fromIndex: number, toIndex: number): boolean {
        if (
            fromIndex < 0 ||
            fromIndex >= this.values.length ||
            toIndex < 0 ||
            toIndex >= this.values.length ||
            fromIndex === toIndex
        ) {
            return false;
        }

        const [movedValue] = this.values.splice(fromIndex, 1);
        this.values.splice(toIndex, 0, movedValue);

        const [movedRaw] = this.rawValues.splice(fromIndex, 1);
        this.rawValues.splice(toIndex, 0, movedRaw);

        const [movedId] = this.ids.splice(fromIndex, 1);
        this.ids.splice(toIndex, 0, movedId);

        // ID-keyed storage means transient errors follow their occurrence
        // automatically — no key remapping needed on reorder.
        return true;
    }

    set(index: number, value: Value, rawValue?: string): void {
        if (index < 0 || index >= this.values.length) {
            return;
        }

        this.values[index] = value;
        this.rawValues[index] = rawValue;
        // Any user-driven value change clears the transient for that occurrence so
        // descriptor validation owns the slot from here on.
        this.transientErrors.delete(this.ids[index]);
    }

    setTransientError(occurrenceId: string, message: string): boolean {
        // Rejects unknown IDs so callers learn their captured ID is stale (the
        // occurrence was removed or values were wholesale-replaced via setValues).
        if (!this.ids.includes(occurrenceId)) {
            return false;
        }
        this.transientErrors.set(occurrenceId, message);
        return true;
    }

    clearTransientError(occurrenceId: string): boolean {
        return this.transientErrors.delete(occurrenceId);
    }

    clearAllTransientErrors(): void {
        this.transientErrors.clear();
    }

    getTransientError(occurrenceId: string): string | undefined {
        return this.transientErrors.get(occurrenceId);
    }

    hasTransientErrors(): boolean {
        return this.transientErrors.size > 0;
    }

    // ? Uses total count (not totalValid) so UI buttons gate on all values including empty ones
    canAdd(): boolean {
        return !this.isMaximumReached();
    }

    // ? Uses total count (not totalValid) so users can remove invalid/empty occurrences
    canRemove(): boolean {
        return this.values.length > this.occurrences.getMinimum();
    }

    isMaximumReached(): boolean {
        return this.occurrences.maximumReached(this.values.length);
    }

    /**
     * Full validation of all occurrences: per-value validation + occurrence count checks.
     *
     * Transient errors (set via {@link setTransientError}) are prepended to each
     * occurrence's validationResults with `transient: true`. They count as field errors
     * for totalValid/min-max calculations — matching the rule that a field with an
     * error doesn't satisfy required.
     */
    validate(): OccurrenceManagerState {
        const occurrenceValidation: OccurrenceValidationState[] = this.values.map((value, index) => {
            const descriptorResults = this.descriptor.validate(value, this.config, this.rawValues[index]);
            const transientMessage = this.transientErrors.get(this.ids[index]);
            const validationResults: ValidationResult[] =
                transientMessage != null
                    ? [{message: transientMessage, transient: true}, ...descriptorResults]
                    : descriptorResults;
            const breaksRequired = this.descriptor.valueBreaksRequired(value);

            return {index, breaksRequired, validationResults};
        });

        // ? totalValid counts only non-empty, error-free values for validation checks,
        // ? while canAdd/canRemove use values.length (total) to gate UI buttons
        const totalValid = occurrenceValidation.filter(
            ov => !ov.breaksRequired && ov.validationResults.length === 0,
        ).length;

        const isMinimumBreached = this.occurrences.minimumBreached(totalValid);
        const isMaximumBreached = this.occurrences.maximumBreached(totalValid);

        return {
            ids: this.getIds(),
            values: this.getValues(),
            occurrenceValidation,
            totalValid,
            isMinimumBreached,
            isMaximumBreached,
            isValid:
                !isMinimumBreached &&
                !isMaximumBreached &&
                occurrenceValidation.every(ov => ov.validationResults.length === 0),
            canAdd: this.canAdd(),
            canRemove: this.canRemove(),
        };
    }
}
