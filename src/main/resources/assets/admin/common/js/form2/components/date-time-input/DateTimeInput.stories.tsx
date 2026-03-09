import type {Meta, StoryObj} from '@storybook/preact-vite';
import {useState} from 'react';
import type {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {InputBuilder} from '../../../form/Input';
import {InputTypeName} from '../../../form/InputTypeName';
import {OccurrencesBuilder} from '../../../form/Occurrences';
import type {DateTimeConfig} from '../../descriptor/InputTypeConfig';
import type {InputTypeComponentProps} from '../../types';
import {DateTimeInput} from './DateTimeInput';

function makeConfig(overrides: Partial<DateTimeConfig> = {}): DateTimeConfig {
    return {default: undefined, ...overrides};
}

function makeInput(): InstanceType<typeof InputBuilder>['build'] extends () => infer R ? R : never {
    return new InputBuilder()
        .setName('myDateTime')
        .setInputType(new InputTypeName('DateTime', false))
        .setLabel('Date Time')
        .setOccurrences(new OccurrencesBuilder().setMinimum(0).setMaximum(1).build())
        .setHelpText('')
        .setInputTypeConfig({})
        .build();
}

const meta: Meta<InputTypeComponentProps<DateTimeConfig>> = {
    title: 'InputTypes/DateTimeInput',
    component: DateTimeInput,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        value: {description: 'Current field value (Value object)'},
        onChange: {description: 'Callback fired when the value changes'},
        config: {description: 'DateTime config: default'},
        input: {description: 'Input descriptor (name, label, occurrences, etc.)'},
        enabled: {control: 'boolean', description: 'Whether the input is interactive'},
        index: {description: 'Occurrence index within the form'},
        errors: {description: 'Array of validation error objects'},
    },
};

export default meta;

type Story = StoryObj<InputTypeComponentProps<DateTimeConfig>>;

const defaultArgs: InputTypeComponentProps<DateTimeConfig> = {
    value: ValueTypes.LOCAL_DATE_TIME.newNullValue(),
    onChange: v => console.log('onChange', v.getString()),
    onBlur: () => console.log('onBlur'),
    config: makeConfig(),
    input: makeInput(),
    enabled: true,
    index: 0,
    errors: [],
};

function StatefulDateTime(props: Omit<InputTypeComponentProps<DateTimeConfig>, 'onChange'> & {initialValue?: Value}) {
    const [value, setValue] = useState(props.initialValue ?? props.value);
    return <DateTimeInput {...props} value={value} onChange={setValue} />;
}

export const Default: Story = {
    name: 'Examples / Default',
    render: () => <StatefulDateTime {...defaultArgs} />,
};

export const WithValue: Story = {
    name: 'Examples / With Value',
    render: () => (
        <StatefulDateTime {...defaultArgs} initialValue={ValueTypes.LOCAL_DATE_TIME.newValue('2025-06-15T14:30')} />
    ),
};

export const WithDefaultButton: Story = {
    name: 'Examples / With Default Button',
    render: () => <StatefulDateTime {...defaultArgs} config={makeConfig({default: new Date(2025, 0, 1, 9, 0)})} />,
};

export const Disabled: Story = {
    name: 'States / Disabled',
    render: () => (
        <StatefulDateTime
            {...defaultArgs}
            initialValue={ValueTypes.LOCAL_DATE_TIME.newValue('2025-06-15T14:30')}
            enabled={false}
        />
    ),
};

export const WithError: Story = {
    name: 'States / With Error',
    render: () => <StatefulDateTime {...defaultArgs} errors={[{message: 'Value is not a valid date-time'}]} />,
};

export const AllStates: Story = {
    name: 'States / All States',
    render: () => (
        <div className='w-96 space-y-6 p-4'>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Empty</h3>
                <StatefulDateTime {...defaultArgs} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>With Value</h3>
                <StatefulDateTime
                    {...defaultArgs}
                    initialValue={ValueTypes.LOCAL_DATE_TIME.newValue('2025-06-15T14:30')}
                />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Disabled</h3>
                <StatefulDateTime
                    {...defaultArgs}
                    initialValue={ValueTypes.LOCAL_DATE_TIME.newValue('2025-06-15T14:30')}
                    enabled={false}
                />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>With Default Button</h3>
                <StatefulDateTime {...defaultArgs} config={makeConfig({default: new Date(2025, 0, 1, 9, 0)})} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Error</h3>
                <StatefulDateTime {...defaultArgs} errors={[{message: 'Value is not a valid date-time'}]} />
            </div>
        </div>
    ),
};
