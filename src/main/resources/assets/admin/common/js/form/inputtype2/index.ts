// Legacy bridge (for IIFE / InputTypeManager system)
export {BaseInputType} from './BaseInputType';
// React input type system (for CS and future consumers)
export {ComponentRegistry} from './ComponentRegistry';
// Descriptor system
export {DescriptorRegistry} from './descriptor/DescriptorRegistry';
export {initBuiltInDescriptors} from './descriptor/initBuiltInDescriptors';
export {initBuiltInComponents} from './initBuiltInComponents';
export {initBuiltInTypes} from './initBuiltInTypes';
export {TextLineInput} from './TextLineInput';
export type {InputTypeComponent, InputTypeComponentProps} from './types';
export {getFirstError} from './types';
export {UnsupportedInput} from './UnsupportedInput';
