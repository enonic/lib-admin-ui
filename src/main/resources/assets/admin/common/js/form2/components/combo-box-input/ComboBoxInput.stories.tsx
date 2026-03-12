import type {Meta, StoryObj} from '@storybook/preact-vite';
import type {ReactElement} from 'react';
import {useCallback, useMemo, useRef, useState} from 'react';

import type {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {InputBuilder} from '../../../form/Input';
import {InputTypeName} from '../../../form/InputTypeName';
import {OccurrencesBuilder} from '../../../form/Occurrences';
import {ComboBoxDescriptor} from '../../descriptor/ComboBoxDescriptor';
import type {ComboBoxConfig} from '../../descriptor/InputTypeConfig';
import {OccurrenceManager, type OccurrenceManagerState} from '../../descriptor/OccurrenceManager';
import type {SelfManagedComponentProps} from '../../types';
import {ComboBoxInput} from './ComboBoxInput';

//
// * Helpers
//

function makeConfig(): ComboBoxConfig {
    return {
        options: [
            {label: 'Norway', value: 'no'},
            {label: 'Sweden', value: 'se'},
            {label: 'Denmark', value: 'dk'},
            {label: 'Finland', value: 'fi'},
            {label: 'Iceland', value: 'is'},
        ],
    };
}

function makeInput(min: number, max: number) {
    return new InputBuilder()
        .setName('myComboBox')
        .setInputType(new InputTypeName('ComboBox', false))
        .setLabel('Country')
        .setOccurrences(new OccurrencesBuilder().setMinimum(min).setMaximum(max).build())
        .setHelpText('')
        .setInputTypeConfig({})
        .build();
}

function makeState(values: string[], min: number, max: number): OccurrenceManagerState {
    const occurrences = new OccurrencesBuilder().setMinimum(min).setMaximum(max).build();
    const config = makeConfig();
    const initialValues = values.map(v => ValueTypes.STRING.newValue(v));
    const manager = new OccurrenceManager<ComboBoxConfig>(occurrences, ComboBoxDescriptor, config, initialValues);
    return manager.validate();
}

function makeDefaultArgs(values: string[], min: number, max: number): SelfManagedComponentProps<ComboBoxConfig> {
    const state = makeState(values, min, max);
    return {
        values: state.values,
        onChange: () => {
            /* empty */
        },
        onAdd: () => {
            /* empty */
        },
        onRemove: () => {
            /* empty */
        },
        onMove: () => {
            /* empty */
        },
        occurrences: new OccurrencesBuilder().setMinimum(min).setMaximum(max).build(),
        config: makeConfig(),
        input: makeInput(min, max),
        enabled: true,
        errors: state.occurrenceValidation,
    };
}

//
// * Meta
//

type Story = StoryObj<typeof ComboBoxInput>;

export default {
    title: 'InputTypes/ComboBoxInput',
    component: ComboBoxInput,
    parameters: {layout: 'centered'},
    tags: ['autodocs'],
} satisfies Meta<typeof ComboBoxInput>;

//
// * Examples
//

export const Empty: Story = {
    name: 'Examples / Empty',
    render: () => (
        <div className='w-80 p-4'>
            <ComboBoxInput {...makeDefaultArgs([], 0, 5)} />
        </div>
    ),
};

export const WithSelections: Story = {
    name: 'Examples / With Selections',
    render: () => (
        <div className='w-80 p-4'>
            <ComboBoxInput {...makeDefaultArgs(['no', 'se'], 0, 5)} />
        </div>
    ),
};

export const SingleSelection: Story = {
    name: 'Examples / Single Selection',
    render: () => (
        <div className='w-80 p-4'>
            <ComboBoxInput {...makeDefaultArgs(['dk'], 0, 1)} />
        </div>
    ),
};

export const MaxReached: Story = {
    name: 'Examples / Max Reached',
    render: () => (
        <div className='w-80 p-4'>
            <h3 className='mb-3 font-medium text-sm'>Max 2 reached — combobox hidden</h3>
            <ComboBoxInput {...makeDefaultArgs(['no', 'se'], 0, 2)} />
        </div>
    ),
};

export const RequiredMinimum: Story = {
    name: 'Examples / Required Minimum',
    render: () => (
        <div className='w-80 p-4'>
            <h3 className='mb-3 font-medium text-sm'>Min 2 — remove buttons hidden</h3>
            <ComboBoxInput {...makeDefaultArgs(['no', 'se'], 2, 5)} />
        </div>
    ),
};

//
// * States
//

export const Disabled: Story = {
    name: 'States / Disabled',
    render: () => (
        <div className='w-80 p-4'>
            <ComboBoxInput {...makeDefaultArgs(['no', 'se'], 0, 5)} enabled={false} />
        </div>
    ),
};

export const AllStates: Story = {
    name: 'States / All States',
    render: () => (
        <div className='w-80 space-y-6 p-4'>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Empty (0:5)</h3>
                <ComboBoxInput {...makeDefaultArgs([], 0, 5)} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>With Selections (0:5)</h3>
                <ComboBoxInput {...makeDefaultArgs(['no', 'se'], 0, 5)} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Max Reached (0:2) — combobox hidden</h3>
                <ComboBoxInput {...makeDefaultArgs(['no', 'se'], 0, 2)} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Required Minimum (2:5) — remove hidden</h3>
                <ComboBoxInput {...makeDefaultArgs(['no', 'se'], 2, 5)} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Single Value (0:1)</h3>
                <ComboBoxInput {...makeDefaultArgs(['dk'], 0, 1)} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Disabled</h3>
                <ComboBoxInput {...makeDefaultArgs(['fi', 'is'], 0, 5)} enabled={false} />
            </div>
        </div>
    ),
};

//
// * Features
//

const InteractiveDemo = (): ReactElement => {
    const occurrences = useMemo(() => new OccurrencesBuilder().setMinimum(0).setMaximum(5).build(), []);
    const config = useMemo(() => makeConfig(), []);
    const input = useMemo(() => makeInput(0, 5), []);

    const managerRef = useRef(new OccurrenceManager<ComboBoxConfig>(occurrences, ComboBoxDescriptor, config, []));
    const [state, setState] = useState<OccurrenceManagerState>(() => managerRef.current.validate());

    const handleAdd = useCallback((value?: Value) => {
        if (!managerRef.current.add(value)) return;
        setState(managerRef.current.validate());
    }, []);

    const handleRemove = useCallback((index: number) => {
        if (!managerRef.current.remove(index)) return;
        setState(managerRef.current.validate());
    }, []);

    const handleMove = useCallback((fromIndex: number, toIndex: number) => {
        if (!managerRef.current.move(fromIndex, toIndex)) return;
        setState(managerRef.current.validate());
    }, []);

    const handleChange = useCallback((index: number, value: Value) => {
        managerRef.current.set(index, value);
        setState(managerRef.current.validate());
    }, []);

    return (
        <div className='flex w-100 flex-col gap-y-4 p-4'>
            <div className='w-96 rounded-sm bg-surface-primary p-3 text-sm'>
                <p className='mb-2 font-medium'>Interactive (0:5):</p>
                <ul className='space-y-1 text-xs'>
                    <li>Select options from the dropdown</li>
                    <li>Drag to reorder, click X to remove</li>
                    <li>Filter by typing in the search input</li>
                </ul>
            </div>
            <ComboBoxInput
                values={state.values}
                onChange={handleChange}
                onAdd={handleAdd}
                onRemove={handleRemove}
                onMove={handleMove}
                occurrences={occurrences}
                config={config}
                input={input}
                enabled={true}
                errors={state.occurrenceValidation}
            />
            <div className='rounded-sm bg-surface-primary p-3'>
                <p className='text-sm'>
                    <span className='font-medium'>Values:</span> [
                    {state.values.map(v => (v.isNull() ? 'null' : `"${v.getString()}"`)).join(', ')}]
                </p>
                <p className='text-sm'>
                    <span className='font-medium'>canAdd:</span> {String(state.canAdd)}
                </p>
                <p className='text-sm'>
                    <span className='font-medium'>canRemove:</span> {String(state.canRemove)}
                </p>
                <p className='text-sm'>
                    <span className='font-medium'>isValid:</span> {String(state.isValid)}
                </p>
            </div>
        </div>
    );
};

export const Interactive: Story = {
    name: 'Features / Interactive',
    render: () => <InteractiveDemo />,
};
