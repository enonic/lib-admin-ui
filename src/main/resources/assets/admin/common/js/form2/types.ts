import type {ComponentType} from 'react';
import type {Value} from '../data/Value';
import type {Input} from '../form/Input';
import type {Occurrences} from '../form/Occurrences';
import type {InputTypeConfig} from './descriptor/InputTypeConfig';
import type {InputTypeDescriptor} from './descriptor/InputTypeDescriptor';
import type {OccurrenceManagerState} from './descriptor/OccurrenceManager';
import type {ValidationResult} from './descriptor/ValidationResult';

export type InputTypeMode = 'list' | 'single' | 'internal';

/** Props every React input type component receives (one per occurrence). */
export type InputTypeComponentProps<C extends InputTypeConfig = InputTypeConfig> = {
    value: Value;
    onChange: (value: Value, rawValue?: string) => void;
    onBlur?: () => void;
    config: C;
    input: Input;
    enabled: boolean;
    index: number;
    errors: ValidationResult[];
};

/** The shape stored in ComponentRegistry: a Preact functional or class component. */
export type InputTypeComponent<C extends InputTypeConfig = InputTypeConfig> = ComponentType<InputTypeComponentProps<C>>;

/** Props for self-managed input type components (e.g. ComboBox) that handle their own multi-value UI. */
export type SelfManagedComponentProps<C extends InputTypeConfig = InputTypeConfig> = {
    values: Value[];
    onChange: (index: number, value: Value, rawValue?: string) => void;
    onBlur?: (index: number) => void;
    onAdd: (value?: Value) => void;
    onRemove: (index: number) => void;
    onMove: (fromIndex: number, toIndex: number) => void;
    occurrences: Occurrences;
    config: C;
    input: Input;
    enabled: boolean;
    errors: OccurrenceManagerState['occurrenceValidation'];
};

export type SelfManagedInputTypeComponent<C extends InputTypeConfig = InputTypeConfig> = ComponentType<
    SelfManagedComponentProps<C>
>;

export type InputTypeDefinition<C extends InputTypeConfig = InputTypeConfig> =
    | {
          mode: 'list';
          descriptor: InputTypeDescriptor<C>;
          component?: InputTypeComponent<C>;
      }
    | {
          mode: 'single';
          descriptor: InputTypeDescriptor<C>;
          component?: InputTypeComponent<C>;
      }
    | {
          mode: 'internal';
          descriptor: InputTypeDescriptor<C>;
          component?: SelfManagedInputTypeComponent<C>;
      };
