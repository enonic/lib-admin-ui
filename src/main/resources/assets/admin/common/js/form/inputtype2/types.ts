import type {ComponentType} from 'react';
import type {Value} from '../../data/Value';
import type {Input} from '../Input';
import type {InputTypeConfig} from './descriptor/InputTypeConfig';
import type {ValidationResult} from './descriptor/ValidationResult';

/** Props every React input type component receives (one per occurrence). */
export type InputTypeComponentProps<C extends InputTypeConfig = InputTypeConfig> = {
    value: Value;
    onChange: (value: Value) => void;
    onBlur?: () => void;
    config: C;
    input: Input;
    enabled: boolean;
    index: number;
    errors: ValidationResult[];
};

/** The shape stored in ComponentRegistry: a Preact functional or class component. */
export type InputTypeComponent<C extends InputTypeConfig = InputTypeConfig> = ComponentType<InputTypeComponentProps<C>>;
