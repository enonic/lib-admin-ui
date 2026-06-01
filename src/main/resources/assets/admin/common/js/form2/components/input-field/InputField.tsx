import {type ReactElement, useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {PropertyArray} from '../../../data/PropertyArray';
import {PropertyPath, PropertyPathElement} from '../../../data/PropertyPath';
import type {PropertySet} from '../../../data/PropertySet';
import type {Value} from '../../../data/Value';
import type {Input} from '../../../form/Input';
import {getEffectiveOccurrences} from '../../descriptor/getEffectiveOccurrences';
import type {OccurrenceValidationState} from '../../descriptor/OccurrenceManager';
import {generateProcessingToken, type ProcessingToken, type RevealOptions} from '../../FieldRegistry';
import {useFieldRegistry} from '../../FieldRegistryContext';
import {useOccurrenceManager} from '../../hooks/useOccurrenceManager';
import {usePropertyArray} from '../../hooks/usePropertyArray';
import {useI18n} from '../../I18nContext';
import {useRawValueMap} from '../../RawValueContext';
import {InputTypeRegistry} from '../../registry/InputTypeRegistry';
import type {InputTypeComponent, InputTypeDefinition, SelfManagedInputTypeComponent} from '../../types';
import {getOccurrenceErrorMessage} from '../../utils/validation';
import {useValidationVisibility} from '../../ValidationContext';
import {FieldError} from '../field-error';
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
            // Transient entries (externally injected, e.g. translation errors) bypass
            // this filter — they represent system messages that should be visible
            // regardless of user interaction state.
            const transientOnly = entry.validationResults.filter(r => r.transient === true);
            if (transientOnly.length === 0) {
                return {...entry, breaksRequired: false, validationResults: []};
            }
            return {...entry, breaksRequired: false, validationResults: transientOnly};
        }
        return entry;
    });
}

function moveIndex(index: number, fromIndex: number, toIndex: number): number {
    if (index === fromIndex) {
        return toIndex;
    }

    if (fromIndex < toIndex && index > fromIndex && index <= toIndex) {
        return index - 1;
    }

    if (fromIndex > toIndex && index >= toIndex && index < fromIndex) {
        return index + 1;
    }

    return index;
}

function moveTouchedIndexes(touched: Set<number>, fromIndex: number, toIndex: number): Set<number> {
    if (touched.size === 0 || fromIndex === toIndex) {
        return touched;
    }

    let changed = false;
    const next = new Set<number>();

    touched.forEach(index => {
        const movedIndex = moveIndex(index, fromIndex, toIndex);
        if (movedIndex !== index) {
            changed = true;
        }
        next.add(movedIndex);
    });

    return changed ? next : touched;
}

function removeTouchedIndex(touched: Set<number>, removedIndex: number): Set<number> {
    if (touched.size === 0) {
        return touched;
    }

    let changed = false;
    const next = new Set<number>();

    touched.forEach(index => {
        if (index === removedIndex) {
            changed = true;
            return;
        }

        const shiftedIndex = index > removedIndex ? index - 1 : index;
        if (shiftedIndex !== index) {
            changed = true;
        }
        next.add(shiftedIndex);
    });

    return changed ? next : touched;
}

function moveIndexedArrayItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
    if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) {
        return items;
    }

    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
}

function removeIndexedArrayItem<T>(items: T[], index: number): T[] {
    if (index < 0 || index >= items.length) {
        return items;
    }

    const next = items.slice();
    next.splice(index, 1);
    return next;
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
    const t = useI18n();
    const visibility = useValidationVisibility();
    const rawValueMap = useRawValueMap();
    const [touched, setTouched] = useState<Set<number>>(() => new Set());

    const defaultValue = useMemo((): Value => {
        // biome-ignore lint/complexity/useLiteralKeys: 'default' is a reserved word
        const raw = input.getInputTypeConfig()?.['default']?.[0]?.value;
        if (raw == null) return descriptor.getValueType().newNullValue();
        const value = descriptor.createDefaultValue(raw);
        if (value.isNull()) return descriptor.getValueType().newNullValue();
        if (descriptor.validate(value, config).length > 0) return descriptor.getValueType().newNullValue();
        return value;
    }, [input, descriptor, config]);

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

    const {
        state,
        add,
        remove,
        move,
        set,
        sync,
        setTransientError,
        clearTransientError,
        clearAllTransientErrors,
        getOccurrenceIds,
    } = useOccurrenceManager({
        occurrences,
        descriptor,
        config,
        initialValues: values,
        autoSeed: definition.mode !== 'internal',
        defaultValue,
    });

    const inputRefsRef = useRef<Map<string, HTMLElement>>(new Map());
    const inputRefCallbacksRef = useRef<Map<string, (el: HTMLElement | null) => void>>(new Map());
    const processingTokensRef = useRef<Map<string, ProcessingToken>>(new Map());
    const suppressBlurNotifyRef = useRef(false);
    const activeNotifierRef = useRef<((path: string | undefined) => void) | null>(null);
    const [, setTick] = useState(0);
    const forceRender = useCallback((): void => setTick(tick => tick + 1), []);
    const [highlightTrigger, setHighlightTrigger] = useState<{occurrenceId: string; count: number} | undefined>(
        undefined,
    );

    // Prune processing tokens and cached ref callbacks for occurrences that no
    // longer exist. Runs every render; the Maps are small (one entry per
    // locked / mounted occurrence).
    useEffect(() => {
        const ids = new Set(state.ids);
        let pruned = false;
        processingTokensRef.current.forEach((_token, occId) => {
            if (!ids.has(occId)) {
                processingTokensRef.current.delete(occId);
                pruned = true;
            }
        });
        inputRefCallbacksRef.current.forEach((_cb, occId) => {
            if (!ids.has(occId)) {
                inputRefCallbacksRef.current.delete(occId);
            }
        });
        if (pruned) forceRender();
    }, [state.ids, forceRender]);

    const fieldRegistry = useFieldRegistry();
    // No useMemo: parent reorders mutate propertySet's index without changing identity.
    const fieldPath = PropertyPath.fromParent(
        propertySet.getPropertyPath(),
        new PropertyPathElement(input.getName(), 0),
    ).toString();

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
            // Store null for values that fail validation (e.g., out-of-range numbers),
            // matching how unparseable values like "abc" are already stored as null.
            const storedValue =
                !value.isNull() && descriptor.validate(value, config, rawValue).length > 0
                    ? descriptor.getValueType().newNullValue()
                    : value;
            set(index, storedValue, rawValue);
            propertyArray.set(index, storedValue);
        },
        [markTouched, rawValueMap, inputName, set, propertyArray, descriptor, config],
    );

    const handleBlur = useCallback(
        (index: number) => {
            markTouched(index);
        },
        [markTouched],
    );

    const handleAdd = useCallback(
        (value?: Value) => {
            const newValue = value ?? defaultValue;
            if (!add(newValue)) return;
            propertyArray.add(newValue);
        },
        [add, propertyArray, defaultValue],
    );

    const handleRemove = useCallback(
        (index: number) => {
            if (!remove(index)) return;
            setTouched(prev => removeTouchedIndex(prev, index));
            if (rawValueMap != null) {
                const rawValues = rawValueMap.get(inputName);
                if (rawValues != null) {
                    rawValueMap.set(inputName, removeIndexedArrayItem(rawValues, index));
                }
            }
            propertyArray.remove(index);
        },
        [remove, rawValueMap, inputName, propertyArray],
    );

    const handleMove = useCallback(
        (fromIndex: number, toIndex: number) => {
            if (!move(fromIndex, toIndex)) return;
            setTouched(prev => moveTouchedIndexes(prev, fromIndex, toIndex));
            if (rawValueMap != null) {
                const rawValues = rawValueMap.get(inputName);
                if (rawValues != null) {
                    rawValueMap.set(inputName, moveIndexedArrayItem(rawValues, fromIndex, toIndex));
                }
            }
            propertyArray.move(fromIndex, toIndex);
        },
        [move, rawValueMap, inputName, propertyArray],
    );

    const filteredValidation = filterErrors(state.occurrenceValidation, visibility, touched);
    const filteredState = visibility === 'all' ? state : {...state, occurrenceValidation: filteredValidation};

    const isOccurrenceProcessing = useCallback((occurrenceId: string | undefined): boolean => {
        if (occurrenceId == null) return false;
        return processingTokensRef.current.has(occurrenceId);
    }, []);

    const getInputRefCallback = useCallback((occurrenceId: string): ((el: HTMLElement | null) => void) => {
        const cached = inputRefCallbacksRef.current.get(occurrenceId);
        if (cached != null) return cached;
        const callback = (el: HTMLElement | null): void => {
            if (el == null) {
                inputRefsRef.current.delete(occurrenceId);
            } else {
                inputRefsRef.current.set(occurrenceId, el);
            }
        };
        inputRefCallbacksRef.current.set(occurrenceId, callback);
        return callback;
    }, []);

    const handleOccurrenceFocus = useCallback((): void => {
        activeNotifierRef.current?.(fieldPath);
    }, [fieldPath]);

    const handleOccurrenceBlur = useCallback(
        (occurrenceIndex: number): void => {
            if (suppressBlurNotifyRef.current) {
                suppressBlurNotifyRef.current = false;
            } else {
                activeNotifierRef.current?.(undefined);
            }
            handleBlur(occurrenceIndex);
        },
        [handleBlur],
    );

    const handleAcquireProcessing = useCallback(
        (occurrenceId: string): ProcessingToken | null => {
            if (!state.ids.includes(occurrenceId)) return null;
            if (processingTokensRef.current.has(occurrenceId)) return null;
            const token = generateProcessingToken();
            processingTokensRef.current.set(occurrenceId, token);

            // Blur-on-acquire: if this occurrence's input is currently focused, drop
            // focus AND suppress the resulting notifyActivePath(undefined) so subscribers
            // do not see a fake user blur.
            const el = inputRefsRef.current.get(occurrenceId);
            if (el != null && document.activeElement === el) {
                suppressBlurNotifyRef.current = true;
                el.blur();
            }

            forceRender();
            return token;
        },
        [state.ids, forceRender],
    );

    const handleReleaseProcessing = useCallback(
        (token: ProcessingToken): boolean => {
            for (const [occId, storedToken] of processingTokensRef.current.entries()) {
                if (storedToken === token) {
                    processingTokensRef.current.delete(occId);
                    forceRender();
                    return true;
                }
            }
            return false;
        },
        [forceRender],
    );

    const handleIsProcessing = useCallback((occurrenceId: string): boolean => {
        return processingTokensRef.current.has(occurrenceId);
    }, []);

    const handleReveal = useCallback(
        (occurrenceId?: string, options?: RevealOptions): boolean => {
            const targetId = occurrenceId ?? state.ids[0];
            if (targetId == null) return false;
            if (!state.ids.includes(targetId)) return false;
            const el = inputRefsRef.current.get(targetId);
            if (el == null) return false;
            if (options?.focus === true) {
                if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
                    if (el.readOnly) return false;
                }
            }
            if (options?.scroll !== false) {
                el.scrollIntoView({block: 'center', behavior: 'smooth'});
            }
            setHighlightTrigger(prev => ({
                occurrenceId: targetId,
                count: (prev?.occurrenceId === targetId ? prev.count : 0) + 1,
            }));
            if (options?.focus === true) {
                el.focus({preventScroll: true});
            }
            return true;
        },
        [state.ids],
    );

    const handleFocus = useCallback(
        (occurrenceId?: string): boolean => {
            const targetId = occurrenceId ?? state.ids[0];
            if (targetId == null) return false;
            if (!state.ids.includes(targetId)) return false;
            const el = inputRefsRef.current.get(targetId);
            if (el == null) return false;
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
                if (el.readOnly) return false;
            }
            el.focus();
            return true;
        },
        [state.ids],
    );

    useEffect(() => {
        if (fieldRegistry == null) {
            activeNotifierRef.current = null;
            return undefined;
        }
        const {unregister, notifyActivePath} = fieldRegistry.register(fieldPath, {
            setTransientError,
            clearTransientError,
            clearAllTransientErrors,
            getOccurrenceIds,
            acquireProcessing: handleAcquireProcessing,
            releaseProcessing: handleReleaseProcessing,
            isProcessing: handleIsProcessing,
            reveal: handleReveal,
            focus: handleFocus,
        });
        activeNotifierRef.current = notifyActivePath;
        return () => {
            // Clear active-path subscribers if this field was the focus owner. The
            // registry filters by ownership, so unmounting a non-active field is a no-op.
            notifyActivePath(undefined);
            activeNotifierRef.current = null;
            unregister();
        };
    }, [
        fieldRegistry,
        fieldPath,
        setTransientError,
        clearTransientError,
        clearAllTransientErrors,
        getOccurrenceIds,
        handleAcquireProcessing,
        handleReleaseProcessing,
        handleIsProcessing,
        handleReveal,
        handleFocus,
    ]);

    switch (definition.mode) {
        case 'single': {
            const Component = definition.component;
            const occId = state.ids[0];
            const processing = isOccurrenceProcessing(occId);
            const fieldErrors = filteredValidation[0]?.validationResults ?? [];
            const occurrenceError = getOccurrenceErrorMessage(occurrences, filteredValidation, t);
            const allErrors = occurrenceError != null ? [...fieldErrors, {message: occurrenceError}] : fieldErrors;
            return (
                <div data-component={INPUT_FIELD_NAME}>
                    <Component
                        value={state.values[0] ?? descriptor.getValueType().newNullValue()}
                        onChange={(value: Value, rawValue?: string) => handleChange(0, value, rawValue)}
                        onBlur={() => handleOccurrenceBlur(0)}
                        onFocus={handleOccurrenceFocus}
                        config={config}
                        input={input}
                        enabled={enabled}
                        index={0}
                        errors={allErrors}
                        readOnly={!enabled || processing}
                        processing={processing}
                        inputRef={occId != null ? getInputRefCallback(occId) : undefined}
                        highlight={
                            occId != null && highlightTrigger?.occurrenceId === occId
                                ? highlightTrigger.count
                                : undefined
                        }
                    />
                </div>
            );
        }

        case 'internal': {
            const Component = definition.component;
            // ? Selectors don't auto-seed entries, so filterErrors can't suppress
            // the min-breach on empty fields. Gate on 'all' to match text inputs.
            const occurrenceError =
                visibility === 'all' ? getOccurrenceErrorMessage(occurrences, filteredValidation, t) : undefined;
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
                    {occurrenceError != null && <FieldError className='mt-2' message={occurrenceError} />}
                </div>
            );
        }

        case 'list': {
            const Component = definition.component;
            // A fresh Set per render — keys live in a mutable ref, so the prop value
            // must be recomputed every render to reflect acquire/release transitions.
            const processingOccurrenceIds = new Set(processingTokensRef.current.keys());
            return (
                <div data-component={INPUT_FIELD_NAME}>
                    <OccurrenceList.Root
                        Component={Component}
                        state={filteredState}
                        onAdd={() => handleAdd()}
                        onRemove={handleRemove}
                        onMove={handleMove}
                        onChange={handleChange}
                        onBlur={handleOccurrenceBlur}
                        onFocus={handleOccurrenceFocus}
                        config={config}
                        input={input}
                        enabled={enabled}
                        processingOccurrenceIds={processingOccurrenceIds}
                        getInputRef={getInputRefCallback}
                        highlight={highlightTrigger}
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
