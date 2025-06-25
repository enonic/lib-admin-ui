import type {Meta, StoryObj} from '@storybook/preact-vite';
import {useState} from 'react';
import type {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {InputBuilder} from '../../../form/Input';
import {InputTypeName} from '../../../form/InputTypeName';
import {OccurrencesBuilder} from '../../../form/Occurrences';
import type {TimeConfig} from '../../descriptor/InputTypeConfig';
import type {InputTypeComponentProps} from '../../types';
import {TimeInput} from './TimeInput';

function makeConfig(overrides: Partial<TimeConfig> = {}): TimeConfig {
    return {default: undefined, ...overrides};
}

function makeInput(): InstanceType<typeof InputBuilder>['build'] extends () => infer R ? R : never {
    return new InputBuilder()
        .setName('myTime')
        .setInputType(new InputTypeName('Time', false))
        .setLabel('Time')
        .setOccurrences(new OccurrencesBuilder().setMinimum(0).setMaximum(1).build())
        .setHelpText('')
        .setInputTypeConfig({})
        .build();
}

const meta: Meta<InputTypeComponentProps<TimeConfig>> = {
    title: 'InputTypes/TimeInput',
    component: TimeInput,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        value: {description: 'Current field value (Value object)'},
        onChange: {description: 'Callback fired when the value changes'},
        config: {description: 'Time config: default'},
        input: {description: 'Input descriptor (name, label, occurrences, etc.)'},
        enabled: {control: 'boolean', description: 'Whether the input is interactive'},
        index: {description: 'Occurrence index within the form'},
        errors: {description: 'Array of validation error objects'},
    },
};

export default meta;

type Story = StoryObj<InputTypeComponentProps<TimeConfig>>;

const defaultArgs: InputTypeComponentProps<TimeConfig> = {
    value: ValueTypes.LOCAL_TIME.newNullValue(),
    onChange: v => console.log('onChange', v.getString()),
    onBlur: () => console.log('onBlur'),
    config: makeConfig(),
    input: makeInput(),
    enabled: true,
    index: 0,
    errors: [],
};

export const Default: Story = {
    name: 'Examples / Default',
    args: {...defaultArgs},
};

export const WithValue: Story = {
    name: 'Examples / With Value',
    args: {
        ...defaultArgs,
        value: ValueTypes.LOCAL_TIME.newValue('14:30'),
    },
};

export const WithDefaultButton: Story = {
    name: 'Examples / With Default Button',
    args: {
        ...defaultArgs,
        config: makeConfig({default: new Date(2025, 0, 1, 9, 0)}),
    },
};

export const Disabled: Story = {
    name: 'States / Disabled',
    args: {
        ...defaultArgs,
        value: ValueTypes.LOCAL_TIME.newValue('14:30'),
        enabled: false,
    },
};

export const WithError: Story = {
    name: 'States / With Error',
    args: {
        ...defaultArgs,
        errors: [{message: 'Value is not a valid time'}],
    },
};

function StatefulTime(props: Omit<InputTypeComponentProps<TimeConfig>, 'onChange'> & {initialValue?: Value}) {
    const [value, setValue] = useState(props.initialValue ?? props.value);
    return <TimeInput {...props} value={value} onChange={setValue} />;
}

export const AllStates: Story = {
    name: 'States / All States',
    render: () => (
        <div className='w-80 space-y-6 p-4'>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Empty</h3>
                <StatefulTime {...defaultArgs} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>With Value</h3>
                <StatefulTime {...defaultArgs} initialValue={ValueTypes.LOCAL_TIME.newValue('14:30')} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Disabled</h3>
                <StatefulTime {...defaultArgs} initialValue={ValueTypes.LOCAL_TIME.newValue('14:30')} enabled={false} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>With Default Button</h3>
                <StatefulTime {...defaultArgs} config={makeConfig({default: new Date(2025, 0, 1, 9, 0)})} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Error</h3>
                <StatefulTime {...defaultArgs} errors={[{message: 'Value is not a valid time'}]} />
            </div>
        </div>
    ),
};
