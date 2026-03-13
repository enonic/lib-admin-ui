import type {Meta, StoryObj} from '@storybook/preact-vite';
import {InputBuilder} from '../../../form/Input';
import {InputTypeName} from '../../../form/InputTypeName';
import {OccurrencesBuilder} from '../../../form/Occurrences';
import {UnsupportedInput, type UnsupportedInputProps} from './UnsupportedInput';

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

const meta: Meta<UnsupportedInputProps> = {
    title: 'InputTypes/UnsupportedInput',
    component: UnsupportedInput,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<UnsupportedInputProps>;

const defaultArgs: UnsupportedInputProps = {
    input: makeInput(),
};

export const Default: Story = {
    name: 'Examples / Default',
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
