// Legacy bridge (for IIFE / InputTypeManager system)
export {BaseInputType} from './BaseInputType';
export {Counter} from './components/counter';
export {FieldError, type FieldErrorProps} from './components/field-error';
export {InputField, type InputFieldProps} from './components/input-field';
export {LongInput, type LongInputProps} from './components/long-input';
export {OccurrenceList, type OccurrenceListRootProps} from './components/occurrence-list';
export {RadioButtonInput} from './components/radio-button-input';
export {TextAreaInput} from './components/text-area-input';
export {TextLineInput} from './components/text-line-input';
export {UnsupportedInput} from './components/unsupported-input';
export type {
    FieldSetValidationNode,
    FormValidationNode,
    FormValidationResult,
    InputValidationNode,
    ItemSetValidationNode,
    OptionSetValidationNode,
    SkippedValidationNode,
} from './descriptor/FormValidationResult';
// Descriptor system
export {getEffectiveOccurrences} from './descriptor/getEffectiveOccurrences';
export {SetOccurrenceManager, type SetOccurrenceManagerState} from './descriptor/SetOccurrenceManager';
export {
    type RawValueMap,
    type ValidateFormOptions,
    validateForm,
    validateFormItemsValid,
} from './descriptor/validateForm';
export {type UseInputTypeDescriptorResult, useInputTypeDescriptor} from './hooks/useInputTypeDescriptor';
export {useOccurrenceManager} from './hooks/useOccurrenceManager';
export {type UsePropertyArrayResult, usePropertyArray} from './hooks/usePropertyArray';
export {type UsePropertySetArrayResult, usePropertySetArray} from './hooks/usePropertySetArray';
export {type UseSetOccurrenceManagerResult, useSetOccurrenceManager} from './hooks/useSetOccurrenceManager';
export {I18nProvider, useI18n} from './I18nContext';
export {initBuiltInTypes} from './initBuiltInTypes';
// Raw value tracking
export {RawValueProvider, type RawValueProviderProps, useRawValueMap} from './RawValueContext';
// React input type system (for CS and future consumers)
export {InputTypeRegistry} from './registry/InputTypeRegistry';
export type {
    InputTypeComponent,
    InputTypeComponentProps,
    InputTypeDefinition,
    InputTypeMode,
    SelfManagedComponentProps,
    SelfManagedInputTypeComponent,
} from './types';
export {findByPath, getFirstError, getOccurrenceErrorMessage, type TranslateFn} from './utils/validation';
// Validation
export {
    useValidationVisibility,
    type ValidationVisibility,
    ValidationVisibilityProvider,
    type ValidationVisibilityProviderProps,
} from './ValidationContext';
