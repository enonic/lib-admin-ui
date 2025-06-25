import {type ReactElement, useCallback, useEffect, useMemo} from 'react';

import {PropertyArray} from '../../../data/PropertyArray';
import type {PropertySet} from '../../../data/PropertySet';
import type {Value} from '../../../data/Value';
import type {Input} from '../../../form/Input';
import {getEffectiveOccurrences} from '../../descriptor/getEffectiveOccurrences';
import {useOccurrenceManager} from '../../hooks/useOccurrenceManager';
import {usePropertyArray} from '../../hooks/usePropertyArray';
import {InputTypeRegistry} from '../../registry/InputTypeRegistry';
import type {InputTypeComponent, InputTypeDefinition, SelfManagedInputTypeComponent} from '../../types';
import {OccurrenceList} from '../occurrence-list';
import {UnsupportedInput} from '../unsupported-input';

const INPUT_FIELD_NAME = 'InputField';
const INPUT_FIELD_RESOLVED_NAME = 'InputFieldResolved';

type SupportedInputTypeDefinition =
    | {
          mode: 'list';
          descriptor: InputTypeDefinition['descriptor'];
          component: InputTypeComponent;
      }
    | {
          mode: 'single';
          descriptor: InputTypeDefinition['descriptor'];
          component: InputTypeComponent;
      }
    | {
          mode: 'internal';
          descriptor: InputTypeDefinition['descriptor'];
          component: SelfManagedInputTypeComponent;
      };

export type InputFieldProps = {
    input: Input;
    propertySet: PropertySet;
    enabled: boolean;
};

export type InputFieldResolvedProps = InputFieldProps & {
    definition: SupportedInputTypeDefinition;
};

function hasComponent(definition: InputTypeDefinition | undefined): definition is SupportedInputTypeDefinition {
    return definition != null && definition.component != null;
}

export const InputFieldResolved = ({
    input,
    propertySet,
    enabled,
    definition,
}: InputFieldResolvedProps): ReactElement => {
    const inputName = input.getName();
    const descriptor = definition.descriptor;
    const config = useMemo(() => descriptor.readConfig(input.getInputTypeConfig() ?? {}), [descriptor, input]);
    const occurrences = getEffectiveOccurrences(definition.mode, input.getOccurrences());

    // TODO: [#4328] Seed default value from schema when creating a new PropertyArray
    const propertyArray = useMemo(() => {
        let arr = propertySet.getPropertyArray(inputName);
        if (arr == null) {
            arr = PropertyArray.create()
                .setName(inputName)
                .setType(descriptor.getValueType())
                .setParent(propertySet)
                .build();
            propertySet.addPropertyArray(arr);
        }
        return arr;
    }, [propertySet, inputName, descriptor]);

    const {values} = usePropertyArray(propertyArray);

    const {state, add, remove, move, set, sync} = useOccurrenceManager({
        occurrences,
        descriptor,
        config,
        initialValues: values,
        autoSeed: definition.mode !== 'internal',
    });

    useEffect(() => {
        sync(values);
    }, [values, sync]);

    const handleChange = useCallback(
        (index: number, value: Value, rawValue?: string) => {
            set(index, value, rawValue);
            propertyArray.set(index, value);
        },
        [set, propertyArray],
    );

    const handleAdd = useCallback(
        (value?: Value) => {
            if (!add()) return;
            const newValue = value ?? descriptor.getValueType().newNullValue();
            propertyArray.add(newValue);
        },
        [add, propertyArray, descriptor],
    );

    const handleRemove = useCallback(
        (index: number) => {
            if (!remove(index)) return;
            propertyArray.remove(index);
        },
        [remove, propertyArray],
    );

    const handleMove = useCallback(
        (fromIndex: number, toIndex: number) => {
            if (!move(fromIndex, toIndex)) return;
            propertyArray.move(fromIndex, toIndex);
        },
        [move, propertyArray],
    );

    switch (definition.mode) {
        case 'single': {
            const Component = definition.component;
            return (
                <div data-component={INPUT_FIELD_NAME}>
                    <Component
                        value={state.values[0] ?? descriptor.getValueType().newNullValue()}
                        onChange={(value: Value, rawValue?: string) => handleChange(0, value, rawValue)}
                        config={config}
                        input={input}
                        enabled={enabled}
                        index={0}
                        errors={state.occurrenceValidation[0]?.validationResults ?? []}
                    />
                </div>
            );
        }

        case 'internal': {
            const Component = definition.component;
            // TODO: [#4328] Clamp oversupplied initial values for internal mode to legacy max behavior.
            return (
                <div data-component={INPUT_FIELD_NAME}>
                    <Component
                        values={state.values}
                        onChange={handleChange}
                        onAdd={handleAdd}
                        onRemove={handleRemove}
                        onMove={handleMove}
                        occurrences={occurrences}
                        config={config}
                        input={input}
                        enabled={enabled}
                        errors={state.occurrenceValidation}
                    />
                </div>
            );
        }

        case 'list': {
            const Component = definition.component;
            return (
                <div data-component={INPUT_FIELD_NAME}>
                    <OccurrenceList.Root
                        Component={Component}
                        state={state}
                        onAdd={() => handleAdd()}
                        onRemove={handleRemove}
                        onMove={handleMove}
                        onChange={handleChange}
                        config={config}
                        input={input}
                        enabled={enabled}
                    />
                </div>
            );
        }
    }
};

export const InputField = ({input, propertySet, enabled}: InputFieldProps): ReactElement => {
    const definition = InputTypeRegistry.getDefinition(input.getInputType().getName());

    if (!hasComponent(definition)) {
        return (
            <div data-component={INPUT_FIELD_NAME}>
                <UnsupportedInput input={input} />
            </div>
        );
    }

    return <InputFieldResolved input={input} propertySet={propertySet} enabled={enabled} definition={definition} />;
};

InputFieldResolved.displayName = INPUT_FIELD_RESOLVED_NAME;
InputField.displayName = INPUT_FIELD_NAME;
