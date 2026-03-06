import type {Meta, StoryObj} from '@storybook/preact-vite';
import {useState} from 'react';
import type {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {InputBuilder} from '../../../form/Input';
import {InputTypeName} from '../../../form/InputTypeName';
import {OccurrencesBuilder} from '../../../form/Occurrences';
import type {TextAreaConfig} from '../../descriptor';
import type {InputTypeComponentProps} from '../../types';
import {TextAreaInput} from './TextAreaInput';

function makeConfig(overrides: Partial<TextAreaConfig> = {}): TextAreaConfig {
    return {maxLength: -1, showCounter: false, ...overrides};
}

function makeInput(): InstanceType<typeof InputBuilder>['build'] extends () => infer R ? R : never {
    return new InputBuilder()
        .setName('myTextArea')
        .setInputType(new InputTypeName('TextArea', false))
        .setLabel('Text Area')
        .setOccurrences(new OccurrencesBuilder().setMinimum(0).setMaximum(1).build())
        .setHelpText('')
        .setInputTypeConfig({})
        .build();
}

const meta: Meta<InputTypeComponentProps<TextAreaConfig>> = {
    title: 'InputTypes/TextAreaInput',
    component: TextAreaInput,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        value: {description: 'Current field value (Value object)'},
        onChange: {description: 'Callback fired when the value changes'},
        config: {description: 'TextArea config: maxLength, showCounter'},
        input: {description: 'Input descriptor (name, label, occurrences, etc.)'},
        enabled: {control: 'boolean', description: 'Whether the input is interactive'},
        index: {description: 'Occurrence index within the form'},
        errors: {description: 'Array of validation error objects'},
    },
};

export default meta;

type Story = StoryObj<InputTypeComponentProps<TextAreaConfig>>;

const defaultArgs: InputTypeComponentProps<TextAreaConfig> = {
    value: ValueTypes.STRING.newNullValue(),
    onChange: v => console.log('onChange', v.getString()),
    config: makeConfig(),
    input: makeInput(),
    enabled: true,
    index: 0,
    errors: [],
};

function StatefulTextArea(props: InputTypeComponentProps<TextAreaConfig> & {initialValue?: Value}) {
    const {initialValue, onChange, ...rest} = props;
    const [value, setValue] = useState(initialValue ?? rest.value);

    const handleChange: InputTypeComponentProps<TextAreaConfig>['onChange'] = nextValue => {
        setValue(nextValue);
        onChange(nextValue);
    };

    return <TextAreaInput {...rest} value={value} onChange={handleChange} />;
}

export const Default: Story = {
    name: 'Examples / Default',
    args: {...defaultArgs},
};

export const WithValue: Story = {
    name: 'Examples / With Value',
    args: {
        ...defaultArgs,
        value: ValueTypes.STRING.newValue('Hello, world!'),
    },
};

export const WithMultilineValue: Story = {
    name: 'Examples / With Multiline Value',
    args: {
        ...defaultArgs,
        value: ValueTypes.STRING.newValue('Line one\nLine two\nLine three'),
    },
};

export const Disabled: Story = {
    name: 'States / Disabled',
    args: {
        ...defaultArgs,
        value: ValueTypes.STRING.newValue('Cannot edit this'),
        enabled: false,
    },
};

export const WithError: Story = {
    name: 'States / With Error',
    args: {
        ...defaultArgs,
        value: ValueTypes.STRING.newValue('bad'),
        errors: [{message: 'Value exceeds maximum length'}],
    },
};

export const WithMultipleErrors: Story = {
    name: 'States / Multiple Errors',
    args: {
        ...defaultArgs,
        value: ValueTypes.STRING.newValue('toolong-and-invalid'),
        errors: [{message: 'Value exceeds maximum length of 5'}, {message: 'Value is not valid'}],
    },
};

export const WithCounter: Story = {
    name: 'Examples / Only Counter',
    args: {
        ...defaultArgs,
        value: ValueTypes.STRING.newValue('Text without max length.'),
        config: makeConfig({showCounter: true}),
    },
    render: args => <StatefulTextArea {...args} />,
};

export const WithMaxLength: Story = {
    name: 'Examples / Max Length',
    args: {
        ...defaultArgs,
        value: ValueTypes.STRING.newValue('20 characters max.'),
        config: makeConfig({maxLength: 20}),
    },
    render: args => <StatefulTextArea {...args} />,
};

export const WithMaxLengthAndCounter: Story = {
    name: 'Examples / Max Length + Counter',
    args: {
        ...defaultArgs,
        value: ValueTypes.STRING.newValue('Hello, world!'),
        config: makeConfig({maxLength: 50, showCounter: true}),
    },
    render: args => <StatefulTextArea {...args} />,
};

export const AllStates: Story = {
    name: 'States / All States',
    render: () => (
        <div className='w-80 space-y-6 p-4'>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Empty</h3>
                <TextAreaInput {...defaultArgs} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>With Value</h3>
                <TextAreaInput {...defaultArgs} value={ValueTypes.STRING.newValue('Hello, world!')} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>With Multiline Value</h3>
                <TextAreaInput {...defaultArgs} value={ValueTypes.STRING.newValue('Line one\nLine two\nLine three')} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Disabled</h3>
                <TextAreaInput {...defaultArgs} value={ValueTypes.STRING.newValue('Cannot edit')} enabled={false} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Error</h3>
                <TextAreaInput
                    {...defaultArgs}
                    value={ValueTypes.STRING.newValue('bad')}
                    errors={[{message: 'Value exceeds maximum length'}]}
                />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Max Length</h3>
                <TextAreaInput
                    {...defaultArgs}
                    value={ValueTypes.STRING.newValue('Hello')}
                    config={makeConfig({maxLength: 20})}
                />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Max Length + Counter</h3>
                <TextAreaInput
                    {...defaultArgs}
                    value={ValueTypes.STRING.newValue('Hello, world!')}
                    config={makeConfig({maxLength: 50, showCounter: true})}
                />
            </div>
        </div>
    ),
};
