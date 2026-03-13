import {Input} from '@enonic/ui';
import type {Meta, StoryObj} from '@storybook/preact-vite';
import {ValueTypes} from '../../../data/ValueTypes';
import {InputBuilder} from '../../../form/Input';
import {InputTypeName} from '../../../form/InputTypeName';
import {OccurrencesBuilder} from '../../../form/Occurrences';
import type {NumberConfig} from '../../descriptor/InputTypeConfig';
import type {InputTypeComponentProps} from '../../types';
import {DoubleInput} from './DoubleInput';

function makeConfig(overrides: Partial<NumberConfig> = {}): NumberConfig {
    return {min: undefined, max: undefined, ...overrides};
}

function makeInput(): InstanceType<typeof InputBuilder>['build'] extends () => infer R ? R : never {
    return new InputBuilder()
        .setName('myDouble')
        .setInputType(new InputTypeName('Double', false))
        .setLabel('Double')
        .setOccurrences(new OccurrencesBuilder().setMinimum(0).setMaximum(1).build())
        .setHelpText('')
        .setInputTypeConfig({})
        .build();
}

const meta: Meta<InputTypeComponentProps<NumberConfig>> = {
    title: 'InputTypes/DoubleInput',
    component: DoubleInput,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        value: {description: 'Current field value (Value object)'},
        onChange: {description: 'Callback fired when the value changes'},
        config: {description: 'Number config: min, max'},
        input: {description: 'Input descriptor (name, label, occurrences, etc.)'},
        enabled: {
            control: 'boolean',
            description: 'Whether the input is interactive',
        },
        index: {description: 'Occurrence index within the form'},
        errors: {description: 'Array of validation error objects'},
    },
};

export default meta;

type Story = StoryObj<InputTypeComponentProps<NumberConfig>>;

const defaultArgs: InputTypeComponentProps<NumberConfig> = {
    value: ValueTypes.DOUBLE.newNullValue(),
    onChange: v => console.log('onChange', v.getDouble()),
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
        value: ValueTypes.DOUBLE.newValue('3.14'),
    },
};

export const WithMinValue: Story = {
    name: 'Examples / With Min Value',
    args: {
        ...defaultArgs,
        config: makeConfig({min: -2.5}),
    },
};

export const WithMaxValue: Story = {
    name: 'Examples / With Max Value',
    args: {
        ...defaultArgs,
        config: makeConfig({max: 2.5}),
    },
};

export const WithMinMaxRange: Story = {
    name: 'Examples / With Min/Max Range',
    args: {
        ...defaultArgs,
        value: ValueTypes.DOUBLE.newValue('0.0'),
        config: makeConfig({min: -2.5, max: 2.5}),
    },
};

export const NegativeValue: Story = {
    name: 'Examples / Negative Value',
    args: {
        ...defaultArgs,
        value: ValueTypes.DOUBLE.newValue('-3.14'),
    },
};

export const Zero: Story = {
    name: 'Examples / Zero',
    args: {
        ...defaultArgs,
        value: ValueTypes.DOUBLE.newValue('0'),
    },
};

export const Disabled: Story = {
    name: 'States / Disabled',
    args: {
        ...defaultArgs,
        value: ValueTypes.DOUBLE.newValue('3.14'),
        enabled: false,
    },
};

export const WithMinError: Story = {
    name: 'States / With Min Error',
    args: {
        ...defaultArgs,
        value: ValueTypes.DOUBLE.newValue('-1'),
        config: makeConfig({min: 1}),
        errors: [{message: 'Value must be at least 1'}],
    },
};

export const WithMaxError: Story = {
    name: 'States / With Max Error',
    args: {
        ...defaultArgs,
        value: ValueTypes.DOUBLE.newValue('1'),
        config: makeConfig({max: -1}),
        errors: [{message: 'Value must be at most -1'}],
    },
};

export const AllStates: Story = {
    name: 'States / All States',
    render: () => (
        <div className='w-80 space-y-6 p-4'>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Empty</h3>
                <DoubleInput {...defaultArgs} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>With Value</h3>
                <DoubleInput {...defaultArgs} value={ValueTypes.DOUBLE.newValue('3.14')} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Negative Value</h3>
                <DoubleInput {...defaultArgs} value={ValueTypes.DOUBLE.newValue('-1.5')} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Disabled</h3>
                <DoubleInput {...defaultArgs} value={ValueTypes.DOUBLE.newValue('1.23')} enabled={false} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Error</h3>
                <div className='flex flex-col items-center gap-6'>
                    <div className='text-sm text-subtle'>Value not within min/max bounds.</div>
                    <Input
                        type='number'
                        step={1}
                        min={-1}
                        max={1}
                        value='2'
                        error='Value must be at most 1'
                        onChange={() => {
                            /* noop */
                        }}
                    />
                </div>
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>With Min/Max Range</h3>
                <DoubleInput
                    {...defaultArgs}
                    value={ValueTypes.DOUBLE.newValue('50.0')}
                    config={makeConfig({min: 0, max: 100})}
                />
            </div>
        </div>
    ),
};

export const StepBehaviorExplainer: Story = {
    name: 'Step Behavior / Precision Anchoring',
    render: () => (
        <div className='w-100 space-y-6 p-4'>
            <div className='space-y-2 text-sm'>
                <p className='font-medium'>Step precision anchoring</p>
                <p className='text-subtle'>
                    The step matches the most decimal places the user has typed. Once set to a finer precision, it stays
                    there — it only resets to a coarser step when the user types a different precision value, or when
                    the value is reset externally (e.g. a form reset).
                </p>
                <ul className='list-inside list-disc space-y-1 text-subtle'>
                    <li>
                        Type <code>1.5</code> → step becomes <code>0.1</code>
                    </li>
                    <li>
                        Use ▲/▼ to change → step stays <code>0.1</code>
                    </li>
                    <li>
                        Type <code>1.505</code> → step becomes <code>0.001</code>
                    </li>
                    <li>
                        Use ▲/▼ to change → step stays <code>0.001</code>
                    </li>
                    <li>
                        Type <code>2</code> → step resets to <code>1</code>
                    </li>
                </ul>
            </div>
            <DoubleInput {...defaultArgs} value={ValueTypes.DOUBLE.newNullValue()} />
        </div>
    ),
};
