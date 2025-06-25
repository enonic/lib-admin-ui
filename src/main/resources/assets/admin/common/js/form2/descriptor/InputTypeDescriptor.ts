import type {Value} from '../../data/Value';
import type {ValueType} from '../../data/ValueType';
import type {InputTypeConfig} from './InputTypeConfig';
import type {ValidationResult} from './ValidationResult';

/**
 * Pure-logic descriptor for an input type.
 *
 * Captures schema config parsing, value type, default value creation,
 * and validation — everything that does NOT depend on the DOM.
 *
 * One descriptor per input type name (e.g. 'TextLine', 'ComboBox').
 */
export type InputTypeDescriptor<C extends InputTypeConfig = InputTypeConfig> = {
    /** Registration name, e.g. 'TextLine'. */
    readonly name: string;

    /** The ValueType this input type works with. */
    getValueType(): ValueType;

    /** Parse raw inputConfig into a typed config object. */
    readConfig(raw: Record<string, Record<string, unknown>[]>): C;

    /** Create a typed default Value from the raw default config value. */
    createDefaultValue(raw: unknown): Value;

    /**
     * Validate a single value.
     * Returns an empty array when valid.
     */
    validate(value: Value, config: C): ValidationResult[];

    /**
     * Whether the given value should be considered "missing" for
     * required-field purposes.  Used by the occurrence system to
     * count how many valid occurrences exist.
     */
    valueBreaksRequired(value: Value): boolean;
};
