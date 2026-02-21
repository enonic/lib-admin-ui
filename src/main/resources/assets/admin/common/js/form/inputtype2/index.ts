// Legacy bridge (for IIFE / InputTypeManager system)
export {BaseInputType} from './BaseInputType';
export {TextLine} from './TextLine';

// React input type system (for CS and future consumers)
export {ComponentRegistry} from './ComponentRegistry';
export {TextLineInput} from './TextLineInput';
export {UnsupportedInput} from './UnsupportedInput';
export type {InputTypeComponentProps, InputTypeComponent} from './types';
export {getFirstError} from './types';
