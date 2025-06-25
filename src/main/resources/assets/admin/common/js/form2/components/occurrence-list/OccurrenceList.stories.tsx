import type {Meta, StoryObj} from '@storybook/preact-vite';
import type {ReactElement} from 'react';
import {useMemo} from 'react';

import {ValueTypes} from '../../../data/ValueTypes';
import {InputBuilder} from '../../../form/Input';
import {InputTypeName} from '../../../form/InputTypeName';
import {OccurrencesBuilder} from '../../../form/Occurrences';
import type {TextLineConfig} from '../../descriptor/InputTypeConfig';
import {OccurrenceManager, type OccurrenceManagerState} from '../../descriptor/OccurrenceManager';
import {TextLineDescriptor} from '../../descriptor/TextLineDescriptor';
import {useOccurrenceManager} from '../../hooks/useOccurrenceManager';
import {TextLineInput} from '../text-line-input/TextLineInput';
import {OccurrenceList} from './OccurrenceList';

//
// * Helpers
//

function makeConfig(): TextLineConfig {
    return {regexp: undefined, maxLength: -1, showCounter: false};
}

function makeInput(min: number, max: number) {
    return new InputBuilder()
        .setName('myTextLine')
        .setInputType(new InputTypeName('TextLine', false))
        .setLabel('Text Line')
        .setOccurrences(new OccurrencesBuilder().setMinimum(min).setMaximum(max).build())
        .setHelpText('')
        .setInputTypeConfig({})
        .build();
}

function makeState(values: string[], min: number, max: number): OccurrenceManagerState {
    const occurrences = new OccurrencesBuilder().setMinimum(min).setMaximum(max).build();
    const config = makeConfig();
    const initialValues = values.map(v =>
        v === '' ? ValueTypes.STRING.newNullValue() : ValueTypes.STRING.newValue(v),
    );
    const manager = new OccurrenceManager<TextLineConfig>(occurrences, TextLineDescriptor, config, initialValues);
    return manager.validate();
}

const noop = () => {
    /* empty */
};

//
// * Meta
//

type Story = StoryObj<typeof OccurrenceList>;

export default {
    title: 'Form/OccurrenceList',
    component: OccurrenceList,
    parameters: {layout: 'centered'},
    tags: ['autodocs'],
} satisfies Meta<typeof OccurrenceList>;

//
// * Examples
//

export const Single: Story = {
    name: 'Examples / Single',
    render: () => (
        <div className='flex flex-col gap-y-4 p-4'>
            <h3 className='mb-0 font-medium text-sm'>Single (1:1)</h3>
            <OccurrenceList
                Component={TextLineInput}
                state={makeState(['Hello'], 1, 1)}
                onAdd={noop}
                onRemove={noop}
                onMove={noop}
                onChange={noop}
                config={makeConfig()}
                input={makeInput(1, 1)}
                enabled={true}
            />
        </div>
    ),
};

export const Optional: Story = {
    name: 'Examples / Optional',
    render: () => (
        <div className='flex flex-col gap-y-4 p-4'>
            <h3 className='mb-0 font-medium text-sm'>Optional (0:1)</h3>
            <OccurrenceList
                Component={TextLineInput}
                state={makeState(['Hello'], 0, 1)}
                onAdd={noop}
                onRemove={noop}
                onMove={noop}
                onChange={noop}
                config={makeConfig()}
                input={makeInput(0, 1)}
                enabled={true}
            />
        </div>
    ),
};

export const OptionalEmpty: Story = {
    name: 'Examples / Optional Empty',
    render: () => (
        <div className='flex flex-col gap-y-4 p-4'>
            <h3 className='mb-0 font-medium text-sm'>Optional Empty (0:1) — renders bare input with null value</h3>
            <OccurrenceList
                Component={TextLineInput}
                state={makeState([''], 0, 1)}
                onAdd={noop}
                onRemove={noop}
                onMove={noop}
                onChange={noop}
                config={makeConfig()}
                input={makeInput(0, 1)}
                enabled={true}
            />
        </div>
    ),
};

export const OptionalMultipleEmpty: Story = {
    name: 'Examples / Optional Multiple Empty',
    render: () => (
        <div className='flex flex-col gap-y-4 p-4'>
            <h3 className='mb-0 font-medium text-sm'>
                Optional Multiple Empty (0:3) — 1 auto-filled null, no remove button
            </h3>
            <OccurrenceList
                Component={TextLineInput}
                state={makeState([''], 0, 3)}
                onAdd={noop}
                onRemove={noop}
                onMove={noop}
                onChange={noop}
                config={makeConfig()}
                input={makeInput(0, 3)}
                enabled={true}
            />
        </div>
    ),
};

export const RequiredMultiple: Story = {
    name: 'Examples / Required Multiple',
    render: () => (
        <div className='flex flex-col gap-y-4 p-4'>
            <div className='w-96 rounded-sm bg-surface-primary p-3 text-sm'>
                <p className='mb-2 font-medium'>Required Multiple (1:3):</p>
                <ul className='space-y-1 text-xs'>
                    <li>Drag handle and remove button visible</li>
                    <li>Add button shown below the list</li>
                </ul>
            </div>
            <OccurrenceList
                Component={TextLineInput}
                state={makeState(['Alpha', 'Beta'], 1, 3)}
                onAdd={noop}
                onRemove={noop}
                onMove={noop}
                onChange={noop}
                config={makeConfig()}
                input={makeInput(1, 3)}
                enabled={true}
            />
        </div>
    ),
};

export const Unlimited: Story = {
    name: 'Examples / Unlimited',
    render: () => (
        <div className='flex flex-col gap-y-4 p-4'>
            <h3 className='mb-0 font-medium text-sm'>Unlimited (0:0) with 3 values</h3>
            <OccurrenceList
                Component={TextLineInput}
                state={makeState(['Alpha', 'Beta', 'Gamma'], 0, 0)}
                onAdd={noop}
                onRemove={noop}
                onMove={noop}
                onChange={noop}
                config={makeConfig()}
                input={makeInput(0, 0)}
                enabled={true}
            />
        </div>
    ),
};

export const FixedCount: Story = {
    name: 'Examples / Fixed Count',
    render: () => (
        <div className='flex flex-col gap-y-4 p-4'>
            <div className='w-96 rounded-sm bg-surface-primary p-3 text-sm'>
                <p className='mb-2 font-medium'>Fixed Count (3:3):</p>
                <ul className='space-y-1 text-xs'>
                    <li>No add or remove buttons</li>
                    <li>No drag handles</li>
                </ul>
            </div>
            <OccurrenceList
                Component={TextLineInput}
                state={makeState(['Alpha', 'Beta', 'Gamma'], 3, 3)}
                onAdd={noop}
                onRemove={noop}
                onMove={noop}
                onChange={noop}
                config={makeConfig()}
                input={makeInput(3, 3)}
                enabled={true}
            />
        </div>
    ),
};

//
// * States
//

export const WithErrors: Story = {
    name: 'States / With Errors',
    render: () => {
        const occurrences = new OccurrencesBuilder().setMinimum(1).setMaximum(3).build();
        const config: TextLineConfig = {regexp: /^[A-Z]/, maxLength: -1, showCounter: false};
        const values = [ValueTypes.STRING.newValue('Hello'), ValueTypes.STRING.newValue('bad')];
        const manager = new OccurrenceManager<TextLineConfig>(occurrences, TextLineDescriptor, config, values);
        const state = manager.validate();

        return (
            <div className='flex flex-col gap-y-4 p-4'>
                <h3 className='mb-0 font-medium text-sm'>Second value fails regexp validation</h3>
                <OccurrenceList
                    Component={TextLineInput}
                    state={state}
                    onAdd={noop}
                    onRemove={noop}
                    onMove={noop}
                    onChange={noop}
                    config={config}
                    input={makeInput(1, 3)}
                    enabled={true}
                />
            </div>
        );
    },
};

export const Disabled: Story = {
    name: 'States / Disabled',
    render: () => (
        <div className='flex flex-col gap-y-4 p-4'>
            <h3 className='mb-0 font-medium text-sm'>Disabled (1:3)</h3>
            <OccurrenceList
                Component={TextLineInput}
                state={makeState(['Alpha', 'Beta'], 1, 3)}
                onAdd={noop}
                onRemove={noop}
                onMove={noop}
                onChange={noop}
                config={makeConfig()}
                input={makeInput(1, 3)}
                enabled={false}
            />
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
    const initialValues = useMemo(
        () => [ValueTypes.STRING.newValue('First'), ValueTypes.STRING.newValue('Second')],
        [],
    );

    const {state, add, remove, move, set} = useOccurrenceManager({
        occurrences,
        descriptor: TextLineDescriptor,
        config,
        initialValues,
    });

    return (
        <div className='flex w-100 flex-col gap-y-4 p-4'>
            <div className='w-96 rounded-sm bg-surface-primary p-3 text-sm'>
                <p className='mb-2 font-medium'>Interactive (0:5):</p>
                <ul className='space-y-1 text-xs'>
                    <li>Add, remove, drag to reorder, edit values</li>
                    <li>Drag handle appears when 2+ items exist</li>
                </ul>
            </div>
            <OccurrenceList
                Component={TextLineInput}
                state={state}
                onAdd={add}
                onRemove={remove}
                onMove={move}
                onChange={set}
                config={config}
                input={input}
                enabled={true}
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

const InteractiveUnlimitedDemo = (): ReactElement => {
    const occurrences = useMemo(() => new OccurrencesBuilder().setMinimum(1).setMaximum(0).build(), []);
    const config = useMemo(() => makeConfig(), []);
    const input = useMemo(() => makeInput(1, 0), []);
    const initialValues = useMemo(() => [ValueTypes.STRING.newValue('Required field')], []);

    const {state, add, remove, move, set} = useOccurrenceManager({
        occurrences,
        descriptor: TextLineDescriptor,
        config,
        initialValues,
    });

    return (
        <div className='flex w-100 flex-col gap-y-4 p-4'>
            <h3 className='mb-0 font-medium text-sm'>Unlimited (1:0), at least one value required</h3>
            <OccurrenceList
                Component={TextLineInput}
                state={state}
                onAdd={add}
                onRemove={remove}
                onMove={move}
                onChange={set}
                config={config}
                input={input}
                enabled={true}
            />
        </div>
    );
};

export const InteractiveUnlimited: Story = {
    name: 'Features / Interactive Unlimited',
    render: () => <InteractiveUnlimitedDemo />,
};
