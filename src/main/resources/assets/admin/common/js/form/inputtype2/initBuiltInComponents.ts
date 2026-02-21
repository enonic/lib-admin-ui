import {ComponentRegistry} from './ComponentRegistry';
import {TextLineInput} from './TextLineInput';
import type {InputTypeComponent} from './types';

export function initBuiltInComponents(): void {
    // Type assertion needed: TextLineInput uses narrower InputTypeComponentProps<TextLineConfig>,
    // but the registry stores the generic InputTypeComponent. Props contract is tested separately.
    ComponentRegistry.register('TextLine', TextLineInput as InputTypeComponent, true);
}
