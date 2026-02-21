// Legacy bridge (for IIFE / InputTypeManager system)
export {BaseInputType} from './BaseInputType';
export {TextLine} from './TextLine';

// React input type system (for CS and future consumers)
export {ComponentRegistry} from './ComponentRegistry';
export {initBuiltInComponents} from './initBuiltInComponents';
export {initBuiltInTypes} from './initBuiltInTypes';
export {TextLineInput} from './TextLineInput';
export {UnsupportedInput} from './UnsupportedInput';
export type {InputTypeComponentProps, InputTypeComponent} from './types';
export {getFirstError} from './types';

// Descriptor system
export {DescriptorRegistry} from './descriptor/DescriptorRegistry';
export {initBuiltInDescriptors} from './descriptor/initBuiltInDescriptors';
