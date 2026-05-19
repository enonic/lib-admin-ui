import type {Input} from '../../form/Input';

export function getInputAccessibleName(input: Input, index?: number): string {
    const label = input.getLabel() || input.getName().toString();

    if (index == null || !input.getOccurrences().multiple()) {
        return label;
    }

    return `${label} ${index + 1}`;
}
