// Legacy bridge (for IIFE / InputTypeManager system)
export {BaseInputType} from './BaseInputType';
export {CounterDescription} from './components/counter-description';
export {OccurrenceList, type OccurrenceListRootProps} from './components/occurrence-list';
export {TextAreaInput} from './components/text-area-input';
export {TextLineInput} from './components/text-line-input';
export {UnsupportedInput} from './components/unsupported-input';
// Descriptor system
export {DescriptorRegistry} from './descriptor/DescriptorRegistry';
export {initBuiltInDescriptors} from './descriptor/initBuiltInDescriptors';
export {useOccurrenceManager} from './hooks/useOccurrenceManager';
export {I18nProvider, useI18n} from './I18nContext';
export {initBuiltInComponents} from './initBuiltInComponents';
export {initBuiltInTypes} from './initBuiltInTypes';
// React input type system (for CS and future consumers)
export {ComponentRegistry} from './registry/ComponentRegistry';
export type {InputTypeComponent, InputTypeComponentProps} from './types';
export {getFirstError} from './utils/validation';
