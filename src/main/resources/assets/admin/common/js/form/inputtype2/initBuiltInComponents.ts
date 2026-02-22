import {ComponentRegistry} from './ComponentRegistry';
import {TextAreaInput} from './TextAreaInput';
import {TextLineInput} from './TextLineInput';
import type {InputTypeComponent} from './types';

export function initBuiltInComponents(): void {
    // Type assertion needed: concrete components use narrower InputTypeComponentProps<XConfig>,
    // but the registry stores the generic InputTypeComponent. Props contract is tested separately.
    ComponentRegistry.register('TextLine', TextLineInput as InputTypeComponent, true);
    ComponentRegistry.register('TextArea', TextAreaInput as InputTypeComponent, true);
}
