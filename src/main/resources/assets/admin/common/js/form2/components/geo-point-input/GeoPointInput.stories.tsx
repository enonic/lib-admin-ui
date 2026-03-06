import {Input} from '@enonic/ui';
import type {Meta, StoryObj} from '@storybook/preact-vite';
import {ValueTypes} from '../../../data/ValueTypes';
import {InputBuilder} from '../../../form/Input';
import {InputTypeName} from '../../../form/InputTypeName';
import {OccurrencesBuilder} from '../../../form/Occurrences';
import type {GeoPointConfig} from '../../descriptor/InputTypeConfig';
import type {InputTypeComponentProps} from '../../types';
import {GeoPointInput} from './GeoPointInput';

function makeInput(): InstanceType<typeof InputBuilder>['build'] extends () => infer R ? R : never {
    return new InputBuilder()
        .setName('myGeoPoint')
        .setInputType(new InputTypeName('GeoPoint', false))
        .setLabel('Geo Point')
        .setOccurrences(new OccurrencesBuilder().setMinimum(0).setMaximum(1).build())
        .setHelpText('')
        .setInputTypeConfig({})
        .build();
}

const meta: Meta<InputTypeComponentProps<GeoPointConfig>> = {
    title: 'InputTypes/GeoPointInput',
    component: GeoPointInput,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        value: {description: 'Current field value (Value object)'},
        onChange: {description: 'Callback fired when the value changes'},
        config: {description: 'GeoPoint config: {}'},
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

type Story = StoryObj<InputTypeComponentProps<GeoPointConfig>>;

const defaultArgs: InputTypeComponentProps<GeoPointConfig> = {
    value: ValueTypes.GEO_POINT.newNullValue(),
    onChange: v => console.log('onChange', v.getGeoPoint()),
    onBlur: () => console.log('onBlur'),
    config: {},
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
        value: ValueTypes.GEO_POINT.newValue('-27.6954167,-48.4830257'),
    },
};

export const Disabled: Story = {
    name: 'States / Disabled',
    args: {
        ...defaultArgs,
        value: ValueTypes.GEO_POINT.newValue('-27.6954167,-48.4830257'),
        enabled: false,
    },
};

export const WithLatitudeError: Story = {
    name: 'States / With Latitude Error',
    render: () => (
        <Input
            type='text'
            value='-91.0,-48.4830257'
            onChange={() => {
                /* returns ValueTypes.GEO_POINT.newNullValue() */
            }}
            error='Value is not a valid geo point'
        />
    ),
};

export const WithLongitudeError: Story = {
    name: 'States / With Longitude Error',
    render: () => (
        <Input
            type='text'
            value='-27.6954167,181.0'
            onChange={() => {
                /* returns ValueTypes.GEO_POINT.newNullValue() */
            }}
            error='Value is not a valid geo point'
        />
    ),
};

export const WithInvalidError: Story = {
    name: 'States / With Invalid Error',
    render: () => (
        <Input
            type='text'
            value='-27.6954167,'
            onChange={() => {
                /* returns ValueTypes.GEO_POINT.newNullValue() */
            }}
            error='Value is not a valid geo point'
        />
    ),
};

export const AllStates: Story = {
    name: 'States / All States',
    render: () => (
        <div className='w-80 space-y-6 p-4'>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Empty</h3>
                <GeoPointInput {...defaultArgs} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>With Value</h3>
                <GeoPointInput {...defaultArgs} value={ValueTypes.GEO_POINT.newValue('-27.6954167,-48.4830257')} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Disabled</h3>
                <GeoPointInput
                    {...defaultArgs}
                    value={ValueTypes.GEO_POINT.newValue('-27.6954167,-48.4830257')}
                    enabled={false}
                />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>With Latitude Error</h3>
                <Input
                    type='text'
                    value='-91.0,-48.4830257'
                    onChange={() => {
                        /* returns ValueTypes.GEO_POINT.newNullValue() */
                    }}
                    error='Value is not a valid geo point'
                />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>With Longitude Error</h3>
                <Input
                    type='text'
                    value='-27.6954167,181.0'
                    onChange={() => {
                        /* returns ValueTypes.GEO_POINT.newNullValue() */
                    }}
                    error='Value is not a valid geo point'
                />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>With Invalid Error</h3>
                <Input
                    type='text'
                    value='-27.6954167,'
                    onChange={() => {
                        /* returns ValueTypes.GEO_POINT.newNullValue() */
                    }}
                    error='Value is not a valid geo point'
                />
            </div>
        </div>
    ),
};
