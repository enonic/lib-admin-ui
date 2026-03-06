import type {Meta, StoryObj} from '@storybook/preact-vite';
import {useState} from 'react';
import type {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {InputBuilder} from '../../../form/Input';
import {InputTypeName} from '../../../form/InputTypeName';
import {OccurrencesBuilder} from '../../../form/Occurrences';
import type {DateConfig} from '../../descriptor/InputTypeConfig';
import type {InputTypeComponentProps} from '../../types';
import {DateInput} from './DateInput';

function makeConfig(overrides: Partial<DateConfig> = {}): DateConfig {
    return {default: undefined, ...overrides};
}

function makeInput(): InstanceType<typeof InputBuilder>['build'] extends () => infer R ? R : never {
    return new InputBuilder()
        .setName('myDate')
        .setInputType(new InputTypeName('Date', false))
        .setLabel('Date')
        .setOccurrences(new OccurrencesBuilder().setMinimum(0).setMaximum(1).build())
        .setHelpText('')
        .setInputTypeConfig({})
        .build();
}

const meta: Meta<InputTypeComponentProps<DateConfig>> = {
    title: 'InputTypes/DateInput',
    component: DateInput,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        value: {description: 'Current field value (Value object)'},
        onChange: {description: 'Callback fired when the value changes'},
        config: {description: 'Date config: default'},
        input: {description: 'Input descriptor (name, label, occurrences, etc.)'},
        enabled: {control: 'boolean', description: 'Whether the input is interactive'},
        index: {description: 'Occurrence index within the form'},
        errors: {description: 'Array of validation error objects'},
    },
};

export default meta;

type Story = StoryObj<InputTypeComponentProps<DateConfig>>;

const defaultArgs: InputTypeComponentProps<DateConfig> = {
    value: ValueTypes.LOCAL_DATE.newNullValue(),
    onChange: v => console.log('onChange', v.getString()),
    onBlur: () => console.log('onBlur'),
    config: makeConfig(),
    input: makeInput(),
    enabled: true,
    index: 0,
    errors: [],
};

function StatefulDate(props: Omit<InputTypeComponentProps<DateConfig>, 'onChange'> & {initialValue?: Value}) {
    const [value, setValue] = useState(props.initialValue ?? props.value);
    return <DateInput {...props} value={value} onChange={setValue} />;
}

export const Default: Story = {
    name: 'Examples / Default',
    render: () => <StatefulDate {...defaultArgs} />,
};

export const WithValue: Story = {
    name: 'Examples / With Value',
    render: () => <StatefulDate {...defaultArgs} initialValue={ValueTypes.LOCAL_DATE.newValue('2025-06-15')} />,
};

export const WithDefaultButton: Story = {
    name: 'Examples / With Default Button',
    render: () => <StatefulDate {...defaultArgs} config={makeConfig({default: new Date(2025, 0, 1)})} />,
};

export const Disabled: Story = {
    name: 'States / Disabled',
    render: () => (
        <StatefulDate {...defaultArgs} initialValue={ValueTypes.LOCAL_DATE.newValue('2025-06-15')} enabled={false} />
    ),
};

export const WithError: Story = {
    name: 'States / With Error',
    render: () => <StatefulDate {...defaultArgs} errors={[{message: 'Value is not a valid date'}]} />,
};

export const AllStates: Story = {
    name: 'States / All States',
    render: () => (
        <div className='w-80 space-y-6 p-4'>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Empty</h3>
                <StatefulDate {...defaultArgs} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>With Value</h3>
                <StatefulDate {...defaultArgs} initialValue={ValueTypes.LOCAL_DATE.newValue('2025-06-15')} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Disabled</h3>
                <StatefulDate
                    {...defaultArgs}
                    initialValue={ValueTypes.LOCAL_DATE.newValue('2025-06-15')}
                    enabled={false}
                />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>With Default Button</h3>
                <StatefulDate {...defaultArgs} config={makeConfig({default: new Date(2025, 0, 1)})} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Error</h3>
                <StatefulDate {...defaultArgs} errors={[{message: 'Value is not a valid date'}]} />
            </div>
        </div>
    ),
};
