import {Input} from '@enonic/ui';
import type {Meta, StoryObj} from '@storybook/preact-vite';
import {ValueTypes} from '../../../data/ValueTypes';
import {InputBuilder} from '../../../form/Input';
import {InputTypeName} from '../../../form/InputTypeName';
import {OccurrencesBuilder} from '../../../form/Occurrences';
import type {NumberConfig} from '../../descriptor/InputTypeConfig';
import type {InputTypeComponentProps} from '../../types';
import {LongInput} from './LongInput';

function makeConfig(overrides: Partial<NumberConfig> = {}): NumberConfig {
    return {min: undefined, max: undefined, ...overrides};
}

function makeInput(): InstanceType<typeof InputBuilder>['build'] extends () => infer R ? R : never {
    return new InputBuilder()
        .setName('myLong')
        .setInputType(new InputTypeName('Long', false))
        .setLabel('Long Integer')
        .setOccurrences(new OccurrencesBuilder().setMinimum(0).setMaximum(1).build())
        .setHelpText('')
        .setInputTypeConfig({})
        .build();
}

const meta: Meta<InputTypeComponentProps<NumberConfig>> = {
    title: 'InputTypes/LongInput',
    component: LongInput,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        value: {description: 'Current field value (Value object)'},
        onChange: {description: 'Callback fired when the value changes'},
        config: {description: 'Number config: min, max'},
        input: {description: 'Input descriptor (name, label, occurrences, etc.)'},
        enabled: {control: 'boolean', description: 'Whether the input is interactive'},
        index: {description: 'Occurrence index within the form'},
        errors: {description: 'Array of validation error objects'},
    },
};

export default meta;

type Story = StoryObj<InputTypeComponentProps<NumberConfig>>;

const defaultArgs: InputTypeComponentProps<NumberConfig> = {
    value: ValueTypes.LONG.newNullValue(),
    onChange: v => console.log('onChange', v.getLong()),
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
        value: ValueTypes.LONG.newValue('42'),
    },
};

export const WithMinValue: Story = {
    name: 'Examples / With Min Value',
    args: {
        ...defaultArgs,
        config: makeConfig({min: 1}),
    },
};

export const WithMaxValue: Story = {
    name: 'Examples / With Max Value',
    args: {
        ...defaultArgs,
        config: makeConfig({max: 100}),
    },
};

export const WithMinMaxRange: Story = {
    name: 'Examples / With Min/Max Range',
    args: {
        ...defaultArgs,
        value: ValueTypes.LONG.newValue('50'),
        config: makeConfig({min: 1, max: 100}),
    },
};

export const NegativeValue: Story = {
    name: 'Examples / Negative Value',
    args: {
        ...defaultArgs,
        value: ValueTypes.LONG.newValue('-42'),
    },
};

export const Zero: Story = {
    name: 'Examples / Zero',
    args: {
        ...defaultArgs,
        value: ValueTypes.LONG.newValue('0'),
    },
};

export const Disabled: Story = {
    name: 'States / Disabled',
    args: {
        ...defaultArgs,
        value: ValueTypes.LONG.newValue('123'),
        enabled: false,
    },
};

export const WithError: Story = {
    name: 'States / With Error',
    render: () => (
        <div className='flex w-80 flex-col items-center gap-6'>
            <div className='text-sm text-subtle'>Accepts whole numbers only.</div>
            <Input
                type='number'
                step={1}
                value='3.3'
                error='Value is not a valid whole number'
                onChange={() => {
                    /* noop */
                }}
            />
        </div>
    ),
};

export const WithMinError: Story = {
    name: 'States / With Min Error',
    args: {
        ...defaultArgs,
        value: ValueTypes.LONG.newValue('0'),
        config: makeConfig({min: 1}),
        errors: [{message: 'Value must be at least 1'}],
    },
};

export const WithMaxError: Story = {
    name: 'States / With Max Error',
    args: {
        ...defaultArgs,
        value: ValueTypes.LONG.newValue('150'),
        config: makeConfig({max: 100}),
        errors: [{message: 'Value must be at most 100'}],
    },
};

export const WithMultipleErrors: Story = {
    name: 'States / Multiple Errors',
    render: () => (
        <div className='flex w-80 flex-col items-center gap-6'>
            <div className='text-sm text-subtle'>Accepts whole numbers only, max: 100.</div>
            <Input
                type='number'
                step={1}
                max={100}
                value='150.55'
                error='Value is not a valid whole number'
                onChange={() => {
                    /* noop */
                }}
            />
        </div>
    ),
};

export const AllStates: Story = {
    name: 'States / All States',
    render: () => (
        <div className='w-80 space-y-6 p-4'>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Empty</h3>
                <LongInput {...defaultArgs} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>With Value</h3>
                <LongInput {...defaultArgs} value={ValueTypes.LONG.newValue('42')} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Negative Value</h3>
                <LongInput {...defaultArgs} value={ValueTypes.LONG.newValue('-10')} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Disabled</h3>
                <LongInput {...defaultArgs} value={ValueTypes.LONG.newValue('123')} enabled={false} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Error</h3>
                <div className='flex flex-col items-center gap-6'>
                    <div className='text-sm text-subtle'>Accepts whole numbers only.</div>
                    <Input
                        type='number'
                        step={1}
                        value='3.3'
                        error='Value is not a valid whole number'
                        onChange={() => {
                            /* noop */
                        }}
                    />
                </div>
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>With Min/Max Range</h3>
                <LongInput
                    {...defaultArgs}
                    value={ValueTypes.LONG.newValue('50')}
                    config={makeConfig({min: 1, max: 100})}
                />
            </div>
        </div>
    ),
};
