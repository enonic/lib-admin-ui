import type {Value} from '../../../data/Value';
import type {Occurrences} from '../../Occurrences';
import type {InputTypeConfig} from './InputTypeConfig';
import type {InputTypeDescriptor} from './InputTypeDescriptor';
import type {ValidationResult} from './ValidationResult';

export type OccurrenceValidationState = {
    readonly index: number;
    readonly breaksRequired: boolean;
    readonly validationResults: ValidationResult[];
};

export type OccurrenceManagerState = {
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

    constructor(occurrences: Occurrences, descriptor: InputTypeDescriptor<C>, config: C, initialValues: Value[] = []) {
        this.occurrences = occurrences;
        this.descriptor = descriptor;
        this.config = config;
        this.values = [...initialValues];
    }

    getValues(): Value[] {
        return [...this.values];
    }

    setValues(values: Value[]): void {
        this.values = [...values];
    }

    getCount(): number {
        return this.values.length;
    }

    getOccurrences(): Occurrences {
        return this.occurrences;
    }

    add(value?: Value): void {
        if (this.isMaximumReached()) {
            return;
        }

        this.values.push(value ?? this.descriptor.getValueType().newNullValue());
    }

    remove(index: number): void {
        if (index < 0 || index >= this.values.length) {
            return;
        }

        this.values.splice(index, 1);
    }

    move(fromIndex: number, toIndex: number): void {
        if (
            fromIndex < 0 ||
            fromIndex >= this.values.length ||
            toIndex < 0 ||
            toIndex >= this.values.length ||
            fromIndex === toIndex
        ) {
            return;
        }

        const [moved] = this.values.splice(fromIndex, 1);
        this.values.splice(toIndex, 0, moved);
    }

    set(index: number, value: Value): void {
        if (index < 0 || index >= this.values.length) {
            return;
        }

        this.values[index] = value;
    }

    canAdd(): boolean {
        return !this.isMaximumReached();
    }

    canRemove(): boolean {
        return this.values.length > this.occurrences.getMinimum();
    }

    isMaximumReached(): boolean {
        return this.occurrences.maximumReached(this.values.length);
    }

    /**
     * Full validation of all occurrences: per-value validation + occurrence count checks.
     */
    validate(): OccurrenceManagerState {
        const occurrenceValidation: OccurrenceValidationState[] = this.values.map((value, index) => {
            const validationResults = this.descriptor.validate(value, this.config);
            const breaksRequired = this.descriptor.valueBreaksRequired(value);

            return {index, breaksRequired, validationResults};
        });

        const totalValid = occurrenceValidation.filter(
            ov => !ov.breaksRequired && ov.validationResults.length === 0,
        ).length;

        const isMinimumBreached = this.occurrences.minimumBreached(totalValid);
        const isMaximumBreached = this.occurrences.maximumBreached(totalValid);

        return {
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
