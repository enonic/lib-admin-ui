import type {Meta, StoryObj} from '@storybook/preact-vite';
import {useMemo, useState} from 'react';

import type {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {InputBuilder} from '../../../form/Input';
import {InputTypeName} from '../../../form/InputTypeName';
import {OccurrencesBuilder} from '../../../form/Occurrences';
import type {TextLineConfig} from '../../descriptor';
import {OccurrenceManager, TagDescriptor} from '../../descriptor';
import {TagInput} from './TagInput';

type DemoTagInputProps = {
    min: number;
    max: number;
    initialTags?: string[];
    enabled?: boolean;
    config?: TextLineConfig;
};

function makeConfig(overrides: Partial<TextLineConfig> = {}): TextLineConfig {
    return {regexp: undefined, maxLength: -1, showCounter: false, ...overrides};
}

function makeInput(min: number, max: number) {
    return new InputBuilder()
        .setName('tags')
        .setInputType(new InputTypeName('Tag', false))
        .setLabel('Add tag')
        .setOccurrences(new OccurrencesBuilder().setMinimum(min).setMaximum(max).build())
        .setHelpText('')
        .setInputTypeConfig({})
        .build();
}

function toValues(tags: string[]): Value[] {
    return tags.map(tag => ValueTypes.STRING.newValue(tag));
}

function moveValue(values: Value[], fromIndex: number, toIndex: number): Value[] {
    if (
        fromIndex < 0 ||
        fromIndex >= values.length ||
        toIndex < 0 ||
        toIndex >= values.length ||
        fromIndex === toIndex
    ) {
        return values;
    }

    const next = [...values];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
}

function DemoTagInput({min, max, initialTags = [], enabled = true, config = makeConfig()}: DemoTagInputProps) {
    const input = useMemo(() => makeInput(min, max), [min, max]);
    const occurrences = input.getOccurrences();
    const [values, setValues] = useState<Value[]>(() => toValues(initialTags));

    const state = useMemo(
        () => new OccurrenceManager<TextLineConfig>(occurrences, TagDescriptor, config, values).validate(),
        [config, occurrences, values],
    );

    return (
        <div className='w-[32rem]'>
            <TagInput
                values={values}
                onChange={(index, value) =>
                    setValues(prev => prev.map((current, currentIndex) => (currentIndex === index ? value : current)))
                }
                onAdd={value => {
                    if (value == null) {
                        return;
                    }
                    setValues(prev => (occurrences.maximumReached(prev.length) ? prev : [...prev, value]));
                }}
                onRemove={index => setValues(prev => prev.filter((_, currentIndex) => currentIndex !== index))}
                onMove={(fromIndex, toIndex) => setValues(prev => moveValue(prev, fromIndex, toIndex))}
                occurrences={occurrences}
                config={config}
                input={input}
                enabled={enabled}
                errors={state.occurrenceValidation}
            />
        </div>
    );
}

const meta: Meta<typeof TagInput> = {
    title: 'InputTypes/TagInput',
    component: TagInput,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    name: 'Examples / Default',
    render: () => <DemoTagInput min={0} max={3} />,
};

export const Multiple: Story = {
    name: 'Examples / Multiple',
    render: () => <DemoTagInput min={0} max={4} initialTags={['alpha', 'beta', 'gamma']} />,
};

export const MinViolation: Story = {
    name: 'States / Min Violation',
    render: () => <DemoTagInput min={2} max={4} initialTags={['alpha']} />,
};

export const WithFieldError: Story = {
    name: 'States / With Field Error',
    render: () => <DemoTagInput min={1} max={4} initialTags={['alpha']} config={makeConfig({regexp: /^[A-Z]/})} />,
};

export const MaxViolation: Story = {
    name: 'States / Max Violation',
    render: () => <DemoTagInput min={0} max={2} initialTags={['alpha', 'beta', 'gamma']} />,
};

export const RequiredEmpty: Story = {
    name: 'States / Required Empty',
    render: () => <DemoTagInput min={1} max={3} />,
};

export const Disabled: Story = {
    name: 'States / Disabled',
    render: () => <DemoTagInput min={0} max={4} initialTags={['alpha', 'beta']} enabled={false} />,
};
