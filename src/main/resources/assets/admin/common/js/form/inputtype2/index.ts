// Legacy bridge (for IIFE / InputTypeManager system)
export {BaseInputType} from './BaseInputType';
// React input type system (for CS and future consumers)
export {ComponentRegistry} from './ComponentRegistry';
export {CounterDescription} from './CounterDescription';
// Descriptor system
export {DescriptorRegistry} from './descriptor/DescriptorRegistry';
export {initBuiltInDescriptors} from './descriptor/initBuiltInDescriptors';
export {useOccurrenceManager} from './hooks/useOccurrenceManager';
export {I18nProvider, useI18n} from './I18nContext';
export {initBuiltInComponents} from './initBuiltInComponents';
export {initBuiltInTypes} from './initBuiltInTypes';
export {OccurrenceList, type OccurrenceListProps} from './OccurrenceList';
export {TextAreaInput} from './TextAreaInput';
export {TextLineInput} from './TextLineInput';
export type {InputTypeComponent, InputTypeComponentProps} from './types';
export {getFirstError} from './types';
export {UnsupportedInput} from './UnsupportedInput';
