import {useCallback, useEffect, useMemo, useState} from 'react';

import type {Value} from '../../data/Value';
import type {Occurrences} from '../../form/Occurrences';
import type {InputTypeConfig} from '../descriptor/InputTypeConfig';
import type {InputTypeDescriptor} from '../descriptor/InputTypeDescriptor';
import {OccurrenceManager, type OccurrenceManagerState} from '../descriptor/OccurrenceManager';

type UseOccurrenceManagerParams<C extends InputTypeConfig = InputTypeConfig> = {
    occurrences: Occurrences;
    descriptor: InputTypeDescriptor<C>;
    config: C;
    /** One-time seed values for construction. Not reactive — use `sync()` to push updates after mount. */
    initialValues: Value[];
};

type UseOccurrenceManagerResult = {
    state: OccurrenceManagerState;
    add: () => void;
    remove: (index: number) => void;
    move: (fromIndex: number, toIndex: number) => void;
    set: (index: number, value: Value) => void;
    sync: (values: Value[]) => void;
};

export function useOccurrenceManager<C extends InputTypeConfig = InputTypeConfig>({
    occurrences,
    descriptor,
    config,
    initialValues,
}: UseOccurrenceManagerParams<C>): UseOccurrenceManagerResult {
    // Minimum fill target: for non-multiple inputs (max=1), always at least 1 so the bare input
    // renders immediately — matching legacy behavior where single-optional fields show one input.
    const minFill = useMemo(
        () => (occurrences.multiple() ? occurrences.getMinimum() : Math.max(occurrences.getMinimum(), 1)),
        [occurrences],
    );

    // biome-ignore lint/correctness/useExhaustiveDependencies: initialValues consumed only on construction
    const manager = useMemo(() => {
        const m = new OccurrenceManager<C>(occurrences, descriptor, config, initialValues);

        // Eagerly fill to minFill so the first render already has values.
        // Break if add() is a no-op (max reached) to prevent infinite loop on malformed schemas.
        while (m.getCount() < minFill) {
            const before = m.getCount();
            m.add();
            if (m.getCount() === before) break;
        }

        return m;
    }, [occurrences, descriptor, config, minFill]);

    const [state, setState] = useState<OccurrenceManagerState>(() => manager.validate());

    useEffect(() => {
        setState(manager.validate());
    }, [manager]);

    const add = useCallback(() => {
        manager.add();
        setState(manager.validate());
    }, [manager]);

    const remove = useCallback(
        (index: number) => {
            manager.remove(index);
            setState(manager.validate());
        },
        [manager],
    );

    const move = useCallback(
        (fromIndex: number, toIndex: number) => {
            manager.move(fromIndex, toIndex);
            setState(manager.validate());
        },
        [manager],
    );

    const set = useCallback(
        (index: number, value: Value) => {
            manager.set(index, value);
            setState(manager.validate());
        },
        [manager],
    );

    const sync = useCallback(
        (values: Value[]) => {
            manager.setValues(values);
            // Re-enforce minFill after external value replacement (e.g., PropertyArray cleared).
            // Break if add() is a no-op (max reached) to prevent infinite loop on malformed schemas.
            while (manager.getCount() < minFill) {
                const before = manager.getCount();
                manager.add();
                if (manager.getCount() === before) break;
            }
            setState(manager.validate());
        },
        [manager, minFill],
    );

    return {state, add, remove, move, set, sync};
}
