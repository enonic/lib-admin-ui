// Re-exported from @enonic/input-types: the input types live in the toolkit now (#4692).
import {inputTypeRegistry, registerBuiltInTypes} from '@enonic/input-types';

export * from '@enonic/input-types';
export {BaseInputType} from './BaseInputType';

/** The registry the built-in and Content Studio's input types register into: the toolkit's shared instance. */
export const InputTypeRegistry = inputTypeRegistry;

/** Registers XP's built-in input types into the shared registry; `registerBuiltInTypes` in the toolkit. */
export function initBuiltInTypes(): void {
    registerBuiltInTypes();
}
