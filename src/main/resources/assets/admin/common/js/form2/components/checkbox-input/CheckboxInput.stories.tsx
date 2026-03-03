import type {Meta, StoryObj} from '@storybook/preact-vite';
import {useState} from 'react';
import type {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {InputBuilder} from '../../../form/Input';
import {InputTypeName} from '../../../form/InputTypeName';
import {OccurrencesBuilder} from '../../../form/Occurrences';
import type {CheckboxConfig} from '../../descriptor/InputTypeConfig';
import type {InputTypeComponentProps} from '../../types';
import {CheckboxInput, type CheckboxInputProps} from './CheckboxInput';

function makeConfig(overrides: Partial<CheckboxConfig> = {}): CheckboxConfig {
    return {alignment: 'LEFT', ...overrides};
}

function makeInput(
    label = 'Accept Terms',
    minOccurrences = 0,
): InstanceType<typeof InputBuilder>['build'] extends () => infer R ? R : never {
    return new InputBuilder()
        .setName('myCheckbox')
        .setInputType(new InputTypeName('Checkbox', false))
        .setLabel(label)
        .setOccurrences(new OccurrencesBuilder().setMinimum(minOccurrences).setMaximum(1).build())
        .setHelpText('')
        .setInputTypeConfig({})
        .build();
}

const meta: Meta<InputTypeComponentProps<CheckboxConfig>> = {
    title: 'InputTypes/CheckboxInput',
    component: CheckboxInput,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        value: {description: 'Current field value (Value object)'},
        onChange: {description: 'Callback fired when the value changes'},
        config: {description: 'Checkbox config: alignment'},
        input: {description: 'Input descriptor (name, label, occurrences, etc.)'},
        enabled: {control: 'boolean', description: 'Whether the input is interactive'},
        index: {description: 'Occurrence index within the form'},
        errors: {description: 'Array of validation error objects'},
    },
};

export default meta;

type Story = StoryObj<InputTypeComponentProps<CheckboxConfig>>;

const defaultArgs: InputTypeComponentProps<CheckboxConfig> = {
    value: ValueTypes.BOOLEAN.fromJsonValue(false),
    onChange: v => console.log('onChange', v.getBoolean()),
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

export const Checked: Story = {
    name: 'Examples / Checked',
    args: {
        ...defaultArgs,
        value: ValueTypes.BOOLEAN.fromJsonValue(true),
    },
};

export const AlignRight: Story = {
    name: 'Examples / Align Right',
    args: {
        ...defaultArgs,
        config: makeConfig({alignment: 'RIGHT'}),
    },
};

export const AlignTop: Story = {
    name: 'Examples / Align Top',
    args: {
        ...defaultArgs,
        config: makeConfig({alignment: 'TOP'}),
    },
};

export const AlignBottom: Story = {
    name: 'Examples / Align Bottom',
    args: {
        ...defaultArgs,
        config: makeConfig({alignment: 'BOTTOM'}),
    },
};

export const Disabled: Story = {
    name: 'States / Disabled',
    args: {
        ...defaultArgs,
        enabled: false,
    },
};

export const DisabledChecked: Story = {
    name: 'States / Disabled Checked',
    args: {
        ...defaultArgs,
        value: ValueTypes.BOOLEAN.fromJsonValue(true),
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

export const Required: Story = {
    name: 'States / Required',
    args: {
        ...defaultArgs,
        input: makeInput('I agree to the terms', 1),
    },
};

function StatefulCheckbox(props: Omit<CheckboxInputProps, 'onChange'> & {initialValue?: Value}) {
    const [value, setValue] = useState(props.initialValue ?? props.value);
    return <CheckboxInput {...props} value={value} onChange={setValue} />;
}

export const AllStates: Story = {
    name: 'States / All States',
    render: () => (
        <div className='w-80 space-y-6 p-4'>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Unchecked</h3>
                <StatefulCheckbox {...defaultArgs} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Checked</h3>
                <StatefulCheckbox {...defaultArgs} initialValue={ValueTypes.BOOLEAN.fromJsonValue(true)} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Align Right</h3>
                <StatefulCheckbox {...defaultArgs} config={makeConfig({alignment: 'RIGHT'})} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Align Top</h3>
                <StatefulCheckbox {...defaultArgs} config={makeConfig({alignment: 'TOP'})} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Align Bottom</h3>
                <StatefulCheckbox {...defaultArgs} config={makeConfig({alignment: 'BOTTOM'})} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Disabled</h3>
                <StatefulCheckbox {...defaultArgs} enabled={false} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Disabled Checked</h3>
                <StatefulCheckbox
                    {...defaultArgs}
                    initialValue={ValueTypes.BOOLEAN.fromJsonValue(true)}
                    enabled={false}
                />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Error</h3>
                <StatefulCheckbox {...defaultArgs} errors={[{message: 'This field is required'}]} />
            </div>
        </div>
    ),
};
