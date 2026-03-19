import type {Meta, StoryObj} from '@storybook/preact-vite';
import type {ReactElement} from 'react';
import {useMemo} from 'react';

import {ValueTypes} from '../../../data/ValueTypes';
import {InputBuilder} from '../../../form/Input';
import {InputTypeName} from '../../../form/InputTypeName';
import {OccurrencesBuilder} from '../../../form/Occurrences';
import {CheckboxDescriptor} from '../../descriptor/CheckboxDescriptor';
import {getEffectiveOccurrences} from '../../descriptor/getEffectiveOccurrences';
import type {CheckboxConfig, TextLineConfig} from '../../descriptor/InputTypeConfig';
import {OccurrenceManager, type OccurrenceManagerState} from '../../descriptor/OccurrenceManager';
import {TextLineDescriptor} from '../../descriptor/TextLineDescriptor';
import {useOccurrenceManager} from '../../hooks/useOccurrenceManager';
import {CheckboxInput} from '../checkbox-input/CheckboxInput';
import {TextLineInput} from '../text-line-input/TextLineInput';
import {OccurrenceList} from './OccurrenceList';

//
// * Helpers
//

function makeConfig(): TextLineConfig {
    return {regexp: undefined, maxLength: -1, showCounter: false};
}

function makeInput(min: number, max: number, label = 'Text Line', helpText = '') {
    return new InputBuilder()
        .setName('myTextLine')
        .setInputType(new InputTypeName('TextLine', false))
        .setLabel(label)
        .setOccurrences(new OccurrencesBuilder().setMinimum(min).setMaximum(max).build())
        .setHelpText(helpText)
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
        <OccurrenceList
            Component={TextLineInput}
            state={makeState(['Hello'], 1, 1)}
            onAdd={noop}
            onRemove={noop}
            onMove={noop}
            onChange={noop}
            config={makeConfig()}
            input={makeInput(1, 1, 'Single (1:1)')}
            enabled={true}
        />
    ),
};

export const Optional: Story = {
    name: 'Examples / Optional',
    render: () => (
        <OccurrenceList
            Component={TextLineInput}
            state={makeState(['Hello'], 0, 1)}
            onAdd={noop}
            onRemove={noop}
            onMove={noop}
            onChange={noop}
            config={makeConfig()}
            input={makeInput(0, 1, 'Optional (0:1)')}
            enabled={true}
        />
    ),
};

export const OptionalEmpty: Story = {
    name: 'Examples / Optional Empty',
    render: () => (
        <OccurrenceList
            Component={TextLineInput}
            state={makeState([''], 0, 1)}
            onAdd={noop}
            onRemove={noop}
            onMove={noop}
            onChange={noop}
            config={makeConfig()}
            input={makeInput(0, 1, 'Optional Empty (0:1)', 'Renders bare input with null value')}
            enabled={true}
        />
    ),
};

export const OptionalMultipleEmpty: Story = {
    name: 'Examples / Optional Multiple Empty',
    render: () => (
        <OccurrenceList
            Component={TextLineInput}
            state={makeState([''], 0, 3)}
            onAdd={noop}
            onRemove={noop}
            onMove={noop}
            onChange={noop}
            config={makeConfig()}
            input={makeInput(0, 3, 'Optional Multiple Empty (0:3)', '1 auto-filled null, no remove button')}
            enabled={true}
        />
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
        <OccurrenceList
            Component={TextLineInput}
            state={makeState(['Alpha', 'Beta', 'Gamma'], 0, 0)}
            onAdd={noop}
            onRemove={noop}
            onMove={noop}
            onChange={noop}
            config={makeConfig()}
            input={makeInput(0, 0, 'Unlimited (0:0)', 'With 3 values')}
            enabled={true}
        />
    ),
};

export const FixedCount: Story = {
    name: 'Examples / Fixed Count',
    render: () => (
        <OccurrenceList
            Component={TextLineInput}
            state={makeState(['Alpha', 'Beta', 'Gamma'], 3, 3)}
            onAdd={noop}
            onRemove={noop}
            onMove={noop}
            onChange={noop}
            config={makeConfig()}
            input={makeInput(3, 3, 'Fixed Count (3:3)', 'No add or remove buttons, no drag handles')}
            enabled={true}
        />
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
            <OccurrenceList
                Component={TextLineInput}
                state={state}
                onAdd={noop}
                onRemove={noop}
                onMove={noop}
                onChange={noop}
                config={config}
                input={makeInput(1, 3, 'With Errors (1:3)', 'Second value fails regexp validation')}
                enabled={true}
            />
        );
    },
};

export const WithMinBreach: Story = {
    name: 'States / Min Breach',
    render: () => (
        <OccurrenceList
            Component={TextLineInput}
            state={makeState(['Alpha'], 2, 5)}
            onAdd={noop}
            onRemove={noop}
            onMove={noop}
            onChange={noop}
            config={makeConfig()}
            input={makeInput(2, 5, 'Min Breach (2:5)', 'Requires at least 2 values, only 1 present')}
            enabled={true}
        />
    ),
};

export const WithMaxBreach: Story = {
    name: 'States / Max Breach',
    render: () => {
        const occurrences = new OccurrencesBuilder().setMinimum(0).setMaximum(2).build();
        const config = makeConfig();
        const values = [
            ValueTypes.STRING.newValue('Alpha'),
            ValueTypes.STRING.newValue('Beta'),
            ValueTypes.STRING.newValue('Gamma'),
        ];
        const manager = new OccurrenceManager<TextLineConfig>(occurrences, TextLineDescriptor, config, values);
        const state = manager.validate();

        return (
            <OccurrenceList
                Component={TextLineInput}
                state={state}
                onAdd={noop}
                onRemove={noop}
                onMove={noop}
                onChange={noop}
                config={config}
                input={makeInput(0, 2, 'Max Breach (0:2)', '3 values exceed max of 2')}
                enabled={true}
            />
        );
    },
};

export const WithRequiredEmpty: Story = {
    name: 'States / Required Empty',
    render: () => (
        <OccurrenceList
            Component={TextLineInput}
            state={makeState([''], 1, 1)}
            onAdd={noop}
            onRemove={noop}
            onMove={noop}
            onChange={noop}
            config={makeConfig()}
            input={makeInput(1, 1, 'Required Empty (1:1)', 'Single required field with no value')}
            enabled={true}
        />
    ),
};

export const Disabled: Story = {
    name: 'States / Disabled',
    render: () => (
        <OccurrenceList
            Component={TextLineInput}
            state={makeState(['Alpha', 'Beta'], 1, 3)}
            onAdd={noop}
            onRemove={noop}
            onMove={noop}
            onChange={noop}
            config={makeConfig()}
            input={makeInput(1, 3, 'Disabled (1:3)')}
            enabled={false}
        />
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

const SingleStrategyDemo = (): ReactElement => {
    // ? 0:0 would normally render in multi-occurrence mode; getEffectiveOccurrences normalizes to 0:1
    const serverOccurrences = useMemo(() => new OccurrencesBuilder().setMinimum(0).setMaximum(0).build(), []);
    const occurrences = useMemo(() => getEffectiveOccurrences('single', serverOccurrences), [serverOccurrences]);
    const config = useMemo((): CheckboxConfig => CheckboxDescriptor.readConfig({}), []);
    const input = useMemo(
        () =>
            new InputBuilder()
                .setName('myCheckbox')
                .setInputType(new InputTypeName('Checkbox', false))
                .setLabel('Accept terms')
                .setOccurrences(occurrences)
                .setHelpText('')
                .setInputTypeConfig({})
                .build(),
        [occurrences],
    );
    const initialValues = useMemo(() => [ValueTypes.BOOLEAN.fromJsonValue(false)], []);

    const {state, add, remove, move, set} = useOccurrenceManager({
        occurrences,
        descriptor: CheckboxDescriptor,
        config,
        initialValues,
    });

    return (
        <div className='flex w-100 flex-col gap-y-4 p-4'>
            <div className='w-96 rounded-sm bg-surface-primary p-3 text-sm'>
                <p className='mb-2 font-medium'>Checkbox with 0:0 server occurrences (normalized to 0:1):</p>
                <ul className='space-y-1 text-xs'>
                    <li>Server sends 0:0, getEffectiveOccurrences normalizes to 0:1</li>
                    <li>No add/remove buttons, no drag handle</li>
                </ul>
            </div>
            <OccurrenceList
                Component={CheckboxInput}
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
                    <span className='font-medium'>canAdd:</span> {String(state.canAdd)}
                </p>
                <p className='text-sm'>
                    <span className='font-medium'>canRemove:</span> {String(state.canRemove)}
                </p>
                <p className='text-sm'>
                    <span className='font-medium'>Values:</span> {state.values.length}
                </p>
            </div>
        </div>
    );
};

export const SingleStrategy: Story = {
    name: 'Features / Single Strategy',
    render: () => <SingleStrategyDemo />,
};

const InteractiveUnlimitedDemo = (): ReactElement => {
    const occurrences = useMemo(() => new OccurrencesBuilder().setMinimum(1).setMaximum(0).build(), []);
    const config = useMemo(() => makeConfig(), []);
    const input = useMemo(() => makeInput(1, 0, 'Unlimited (1:0)', 'At least one value required'), []);
    const initialValues = useMemo(() => [ValueTypes.STRING.newValue('Required field')], []);

    const {state, add, remove, move, set} = useOccurrenceManager({
        occurrences,
        descriptor: TextLineDescriptor,
        config,
        initialValues,
    });

    return (
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
    );
};

export const InteractiveUnlimited: Story = {
    name: 'Features / Interactive Unlimited',
    render: () => <InteractiveUnlimitedDemo />,
};
