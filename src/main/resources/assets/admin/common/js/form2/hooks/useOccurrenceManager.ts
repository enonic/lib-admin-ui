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
    autoSeed?: boolean;
};

type UseOccurrenceManagerResult = {
    state: OccurrenceManagerState;
    add: () => boolean;
    remove: (index: number) => boolean;
    move: (fromIndex: number, toIndex: number) => boolean;
    set: (index: number, value: Value, rawValue?: string) => void;
    sync: (values: Value[]) => void;
};

export function useOccurrenceManager<C extends InputTypeConfig = InputTypeConfig>({
    occurrences,
    descriptor,
    config,
    initialValues,
    autoSeed = true,
}: UseOccurrenceManagerParams<C>): UseOccurrenceManagerResult {
    const minFill = useMemo(() => (autoSeed ? Math.max(occurrences.getMinimum(), 1) : 0), [occurrences, autoSeed]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: initialValues consumed only on construction
    const manager = useMemo(() => {
        const m = new OccurrenceManager<C>(occurrences, descriptor, config, initialValues);

        // Eagerly fill to minFill so the first render already has values.
        // Break if add() is a no-op (max reached) to prevent infinite loop on malformed schemas.
        while (m.getCount() < minFill) {
            if (!m.add()) break;
        }

        return m;
    }, [occurrences, descriptor, config, minFill]);

    const [state, setState] = useState<OccurrenceManagerState>(() => manager.validate());

    useEffect(() => {
        setState(manager.validate());
    }, [manager]);

    const add = useCallback((): boolean => {
        const added = manager.add();
        if (added) setState(manager.validate());
        return added;
    }, [manager]);

    const remove = useCallback(
        (index: number): boolean => {
            const removed = manager.remove(index);
            if (removed) setState(manager.validate());
            return removed;
        },
        [manager],
    );

    const move = useCallback(
        (fromIndex: number, toIndex: number): boolean => {
            const moved = manager.move(fromIndex, toIndex);
            if (moved) setState(manager.validate());
            return moved;
        },
        [manager],
    );

    const set = useCallback(
        (index: number, value: Value, rawValue?: string) => {
            manager.set(index, value, rawValue);
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
                if (!manager.add()) break;
            }
            setState(manager.validate());
        },
        [manager, minFill],
    );

    return {state, add, remove, move, set, sync};
}
