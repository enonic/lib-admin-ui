import type {Meta, StoryObj} from '@storybook/preact-vite';
import {ValueTypes} from '../../data/ValueTypes';
import {InputBuilder} from '../Input';
import {InputTypeName} from '../InputTypeName';
import {OccurrencesBuilder} from '../Occurrences';
import type {InputTypeComponentProps} from './types';
import {UnsupportedInput} from './UnsupportedInput';

function makeInput(
    typeName = 'FancyWidget',
): InstanceType<typeof InputBuilder>['build'] extends () => infer R ? R : never {
    return new InputBuilder()
        .setName('myUnsupported')
        .setInputType(new InputTypeName(typeName, false))
        .setLabel('Unsupported')
        .setOccurrences(new OccurrencesBuilder().setMinimum(0).setMaximum(1).build())
        .setHelpText('')
        .setInputTypeConfig({})
        .build();
}

const meta: Meta<InputTypeComponentProps> = {
    title: 'InputTypes/UnsupportedInput',
    component: UnsupportedInput,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<InputTypeComponentProps>;

const defaultArgs: InputTypeComponentProps = {
    value: ValueTypes.STRING.newNullValue(),
    onChange: () => undefined,
    config: {},
    input: makeInput(),
    enabled: true,
    index: 0,
    errors: [],
};

export const Default: Story = {
    args: {...defaultArgs},
};

export const LongTypeName: Story = {
    name: 'Examples / Long Type Name',
    args: {
        ...defaultArgs,
        input: makeInput('com.vendor.app:super-duper-custom-extra-long-input-type-name'),
    },
    decorators: [
        Story => (
            <div className='w-48'>
                <Story />
            </div>
        ),
    ],
};
