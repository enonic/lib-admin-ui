import {useCallback, useMemo, useState} from 'react';

import type {Value} from '../../../data/Value';
import type {Occurrences} from '../../Occurrences';
import type {InputTypeConfig} from '../descriptor/InputTypeConfig';
import type {InputTypeDescriptor} from '../descriptor/InputTypeDescriptor';
import {OccurrenceManager, type OccurrenceManagerState} from '../descriptor/OccurrenceManager';

type UseOccurrenceManagerParams<C extends InputTypeConfig = InputTypeConfig> = {
    occurrences: Occurrences;
    descriptor: InputTypeDescriptor<C>;
    config: C;
    initialValues: Value[];
};

type UseOccurrenceManagerResult = {
    state: OccurrenceManagerState;
    add: () => void;
    remove: (index: number) => void;
    move: (fromIndex: number, toIndex: number) => void;
    set: (index: number, value: Value) => void;
};

export function useOccurrenceManager<C extends InputTypeConfig = InputTypeConfig>({
    occurrences,
    descriptor,
    config,
    initialValues,
}: UseOccurrenceManagerParams<C>): UseOccurrenceManagerResult {
    // biome-ignore lint/correctness/useExhaustiveDependencies: initialValues consumed only on construction
    const manager = useMemo(
        () => new OccurrenceManager<C>(occurrences, descriptor, config, initialValues),
        [occurrences, descriptor, config],
    );

    const [state, setState] = useState<OccurrenceManagerState>(() => manager.validate());

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

    return {state, add, remove, move, set};
}
