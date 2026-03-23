import {type ReactElement, useCallback, useEffect, useMemo, useState} from 'react';

import {PropertyArray} from '../../../data/PropertyArray';
import type {PropertySet} from '../../../data/PropertySet';
import type {Value} from '../../../data/Value';
import type {Input} from '../../../form/Input';
import {getEffectiveOccurrences} from '../../descriptor/getEffectiveOccurrences';
import type {OccurrenceValidationState} from '../../descriptor/OccurrenceManager';
import {useOccurrenceManager} from '../../hooks/useOccurrenceManager';
import {usePropertyArray} from '../../hooks/usePropertyArray';
import {useRawValueMap} from '../../RawValueContext';
import {InputTypeRegistry} from '../../registry/InputTypeRegistry';
import type {InputTypeComponent, InputTypeDefinition, SelfManagedInputTypeComponent} from '../../types';
import {useValidationVisibility} from '../../ValidationContext';
import {InputLabel} from '../input-label';
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

function filterErrors(
    validation: OccurrenceValidationState[],
    visibility: 'none' | 'interactive' | 'all',
    touched: Set<number>,
): OccurrenceValidationState[] {
    if (visibility === 'all') return validation;
    return validation.map((entry, index) => {
        if (visibility === 'none' || !touched.has(index)) {
            // Clear both per-field errors AND breaksRequired so that
            // getOccurrenceErrorMessage sees suppressed entries as valid
            // and won't generate min/max occurrence errors prematurely.
            return {...entry, breaksRequired: false, validationResults: []};
        }
        return entry;
    });
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
    const occurrences = useMemo(
        () => getEffectiveOccurrences(definition.mode, input.getOccurrences()),
        [definition.mode, input],
    );
    const visibility = useValidationVisibility();
    const rawValueMap = useRawValueMap();
    const [touched, setTouched] = useState<Set<number>>(() => new Set());

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
        const managerValues = sync(values);
        // Push seeded values to PropertyArray so they stay in sync.
        // OccurrenceManager seeds to minFill, but PropertyArray doesn't know about those values.
        const paSize = propertyArray.getSize();
        for (let i = paSize; i < managerValues.length; i++) {
            propertyArray.add(managerValues[i]);
        }
    }, [values, sync, propertyArray]);

    const markTouched = useCallback((index: number) => {
        setTouched(prev => {
            if (prev.has(index)) return prev;
            const next = new Set(prev);
            next.add(index);
            return next;
        });
    }, []);

    const handleChange = useCallback(
        (index: number, value: Value, rawValue?: string) => {
            markTouched(index);
            if (rawValueMap != null) {
                const key = inputName;
                let arr = rawValueMap.get(key);
                if (arr == null) {
                    arr = [];
                    rawValueMap.set(key, arr);
                }
                arr[index] = rawValue;
            }
            set(index, value, rawValue);
            propertyArray.set(index, value);
        },
        [markTouched, rawValueMap, inputName, set, propertyArray],
    );

    const handleBlur = useCallback(
        (index: number) => {
            markTouched(index);
        },
        [markTouched],
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

    const filteredValidation = filterErrors(state.occurrenceValidation, visibility, touched);
    const filteredState = visibility === 'all' ? state : {...state, occurrenceValidation: filteredValidation};

    switch (definition.mode) {
        case 'single': {
            const Component = definition.component;
            return (
                <div data-component={INPUT_FIELD_NAME}>
                    <Component
                        value={state.values[0] ?? descriptor.getValueType().newNullValue()}
                        onChange={(value: Value, rawValue?: string) => handleChange(0, value, rawValue)}
                        onBlur={() => handleBlur(0)}
                        config={config}
                        input={input}
                        enabled={enabled}
                        index={0}
                        errors={filteredValidation[0]?.validationResults ?? []}
                    />
                </div>
            );
        }

        case 'internal': {
            const Component = definition.component;
            // TODO: [#4328] Clamp oversupplied initial values for internal mode to legacy max behavior.
            return (
                <div data-component={INPUT_FIELD_NAME} className='flex flex-col'>
                    <InputLabel className='mb-2' input={input} />
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
                        errors={filteredValidation}
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
                        state={filteredState}
                        onAdd={() => handleAdd()}
                        onRemove={handleRemove}
                        onMove={handleMove}
                        onChange={handleChange}
                        onBlur={handleBlur}
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
