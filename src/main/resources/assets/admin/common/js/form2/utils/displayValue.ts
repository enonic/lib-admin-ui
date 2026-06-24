import type {Value} from '../../data/Value';

export function displayValue(value: Value, rawValue: string | undefined, toDisplay: (v: Value) => string): string {
    if (rawValue != null) return rawValue;
    if (value.isNull()) return '';
    return toDisplay(value);
}
