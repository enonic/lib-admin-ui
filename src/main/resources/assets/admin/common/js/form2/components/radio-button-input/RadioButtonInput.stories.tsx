import type {Meta, StoryObj} from '@storybook/preact-vite';
import {useState} from 'react';
import type {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {InputBuilder} from '../../../form/Input';
import {InputTypeName} from '../../../form/InputTypeName';
import {OccurrencesBuilder} from '../../../form/Occurrences';
import type {RadioButtonConfig} from '../../descriptor/InputTypeConfig';
import type {InputTypeComponentProps} from '../../types';
import {RadioButtonInput} from './RadioButtonInput';

function makeConfig(overrides: Partial<RadioButtonConfig> = {}): RadioButtonConfig {
    return {
        options: [
            {label: 'Option A', value: 'a'},
            {label: 'Option B', value: 'b'},
            {label: 'Option C', value: 'c'},
        ],
        ...overrides,
    };
}

function makeInput(): InstanceType<typeof InputBuilder>['build'] extends () => infer R ? R : never {
    return new InputBuilder()
        .setName('myRadioButton')
        .setInputType(new InputTypeName('RadioButton', false))
        .setLabel('Radio Button')
        .setOccurrences(new OccurrencesBuilder().setMinimum(0).setMaximum(1).build())
        .setHelpText('')
        .setInputTypeConfig({})
        .build();
}

const meta: Meta<InputTypeComponentProps<RadioButtonConfig>> = {
    title: 'InputTypes/RadioButtonInput',
    component: RadioButtonInput,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        value: {description: 'Current field value (Value object)'},
        onChange: {description: 'Callback fired when the value changes'},
        config: {description: 'RadioButton config: options with label and value'},
        input: {description: 'Input descriptor (name, label, occurrences, etc.)'},
        enabled: {control: 'boolean', description: 'Whether the input is interactive'},
        index: {description: 'Occurrence index within the form'},
        errors: {description: 'Array of validation error objects'},
    },
};

export default meta;

type Story = StoryObj<InputTypeComponentProps<RadioButtonConfig>>;

const defaultArgs: InputTypeComponentProps<RadioButtonConfig> = {
    value: ValueTypes.STRING.newNullValue(),
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
        value: ValueTypes.STRING.newValue('b'),
    },
};

export const TwoOptions: Story = {
    name: 'Examples / Two Options',
    args: {
        ...defaultArgs,
        config: makeConfig({
            options: [
                {label: 'Yes', value: 'yes'},
                {label: 'No', value: 'no'},
            ],
        }),
    },
};

export const ManyOptions: Story = {
    name: 'Examples / Many Options',
    args: {
        ...defaultArgs,
        config: makeConfig({
            options: [
                {label: 'Red', value: 'red'},
                {label: 'Orange', value: 'orange'},
                {label: 'Yellow', value: 'yellow'},
                {label: 'Green', value: 'green'},
                {label: 'Blue', value: 'blue'},
                {label: 'Purple', value: 'purple'},
            ],
        }),
    },
};

export const Disabled: Story = {
    name: 'States / Disabled',
    args: {
        ...defaultArgs,
        value: ValueTypes.STRING.newValue('a'),
        enabled: false,
    },
};

export const WithError: Story = {
    name: 'States / With Error',
    args: {
        ...defaultArgs,
        errors: [{message: 'This field is required'}],
    },
};

function StatefulRadio(props: Omit<InputTypeComponentProps<RadioButtonConfig>, 'onChange'> & {initialValue?: Value}) {
    const [value, setValue] = useState(props.initialValue ?? props.value);
    return <RadioButtonInput {...props} value={value} onChange={setValue} />;
}

export const AllStates: Story = {
    name: 'States / All States',
    render: () => (
        <div className='w-80 space-y-6 p-4'>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Empty</h3>
                <StatefulRadio {...defaultArgs} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>With Value</h3>
                <StatefulRadio {...defaultArgs} initialValue={ValueTypes.STRING.newValue('b')} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Disabled</h3>
                <StatefulRadio {...defaultArgs} initialValue={ValueTypes.STRING.newValue('a')} enabled={false} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Error</h3>
                <StatefulRadio {...defaultArgs} errors={[{message: 'This field is required'}]} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Two Options</h3>
                <StatefulRadio
                    {...defaultArgs}
                    initialValue={ValueTypes.STRING.newValue('yes')}
                    config={makeConfig({
                        options: [
                            {label: 'Yes', value: 'yes'},
                            {label: 'No', value: 'no'},
                        ],
                    })}
                />
            </div>
        </div>
    ),
};
