import type {InputTypeComponentProps} from './types';

export function UnsupportedInput({input}: InputTypeComponentProps) {
    const typeName = input.getInputType().getName();
    return (
        <div class="unsupported-input-type">
            Unsupported input type: {typeName}
        </div>
    );
}
