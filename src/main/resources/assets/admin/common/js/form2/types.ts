import type {ComponentType} from 'react';
import type {PropertyPath} from '../data/PropertyPath';
import type {Value} from '../data/Value';
import type {Input} from '../form/Input';
import type {Occurrences} from '../form/Occurrences';
import type {InputTypeConfig, InputTypeDescriptor, OccurrenceManagerState, ValidationResult} from './descriptor';

export type InputTypeMode = 'list' | 'single' | 'internal';

/** Props every React input type component receives (one per occurrence). */
export type InputTypeComponentProps<C extends InputTypeConfig = InputTypeConfig> = {
    value: Value;
    rawValue?: string;
    onChange: (value: Value, rawValue?: string) => void;
    onBlur?: () => void;
    onFocus?: () => void;
    config: C;
    input: Input;
    enabled: boolean;
    index: number;
    errors: ValidationResult[];
    /** True while the field is read-only at the form level. Leaf inputs should treat as non-editable. */
    readOnly?: boolean;
    /** True while an external caller (e.g. AI bridge) holds a processing lock on this occurrence. */
    processing?: boolean;
    /**
     * Callback ref invoked with the leaf input's focusable DOM element. InputField uses this
     * to drive reveal/focus/blur-on-acquire by occurrenceId. Leaf inputs forward the latest
     * value of their internal ref and call with `null` on unmount.
     */
    inputRef?: (el: HTMLElement | null) => void;
    /**
     * Edge-trigger counter for the attention blink. Each increment restarts the one-shot
     * ring pulse — InputField bumps it on `reveal`. Input types that support the affordance
     * forward the value straight to `useBlinkAttention`; others ignore it.
     */
    highlight?: number;
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
    dataPath?: PropertyPath;
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
