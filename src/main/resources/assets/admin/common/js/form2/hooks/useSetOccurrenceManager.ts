import {useCallback, useEffect, useMemo, useState} from 'react';
import type {PropertySet} from '../../data/PropertySet';
import type {Occurrences} from '../../form/Occurrences';
import {SetOccurrenceManager, type SetOccurrenceManagerState} from '../descriptor/SetOccurrenceManager';

export type UseSetOccurrenceManagerResult = {
    state: SetOccurrenceManagerState;
    add: () => {id: string} | null;
    remove: (index: number) => boolean;
    move: (fromIndex: number, toIndex: number) => boolean;
};

/**
 * React hook wrapping SetOccurrenceManager for set-level occurrence management.
 *
 * Does not auto-seed PropertySets. Consumers must ensure the PropertyArray
 * has at least `occurrences.getMinimum()` entries.
 */
export function useSetOccurrenceManager(
    occurrences: Occurrences,
    propertySets: PropertySet[],
): UseSetOccurrenceManagerResult {
    // biome-ignore lint/correctness/useExhaustiveDependencies: propertySets consumed only on construction
    const manager = useMemo(() => new SetOccurrenceManager(occurrences, propertySets), [occurrences]);

    const [state, setState] = useState<SetOccurrenceManagerState>(() => manager.getState());

    useEffect(() => {
        manager.syncPropertySets(propertySets);
        setState(manager.getState());
    }, [manager, propertySets]);

    const add = useCallback((): {id: string} | null => {
        const result = manager.add();
        if (result != null) setState(manager.getState());
        return result;
    }, [manager]);

    const remove = useCallback(
        (index: number): boolean => {
            const removed = manager.remove(index);
            if (removed) setState(manager.getState());
            return removed;
        },
        [manager],
    );

    const move = useCallback(
        (fromIndex: number, toIndex: number): boolean => {
            const moved = manager.move(fromIndex, toIndex);
            if (moved) setState(manager.getState());
            return moved;
        },
        [manager],
    );

    return {state, add, remove, move};
}
