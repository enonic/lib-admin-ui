import {Button} from '@enonic/ui';
import type {Meta, StoryObj} from '@storybook/preact-vite';
import {useEffect, useMemo, useRef, useState} from 'react';
import type {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {InputBuilder} from '../../../form/Input';
import {InputTypeName} from '../../../form/InputTypeName';
import {OccurrencesBuilder} from '../../../form/Occurrences';
import type {TextLineConfig} from '../../descriptor';
import {FieldRegistry, generateProcessingToken, type ProcessingToken} from '../../FieldRegistry';
import {FieldRegistryProvider} from '../../FieldRegistryContext';
import type {InputTypeComponentProps} from '../../types';
import {TextLineInput, type TextLineInputProps} from './TextLineInput';

function makeConfig(overrides: Partial<TextLineConfig> = {}): TextLineConfig {
    return {regexp: undefined, maxLength: -1, showCounter: false, ...overrides};
}

function makeInput(): InstanceType<typeof InputBuilder>['build'] extends () => infer R ? R : never {
    return new InputBuilder()
        .setName('myTextLine')
        .setInputType(new InputTypeName('TextLine', false))
        .setLabel('Text Line')
        .setOccurrences(new OccurrencesBuilder().setMinimum(0).setMaximum(1).build())
        .setHelpText('')
        .setInputTypeConfig({})
        .build();
}

const meta: Meta<TextLineInputProps> = {
    title: 'InputTypes/TextLineInput',
    component: TextLineInput,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        value: {description: 'Current field value (Value object)'},
        onChange: {description: 'Callback fired when the value changes'},
        config: {description: 'TextLine config: regexp, maxLength, showCounter'},
        input: {description: 'Input descriptor (name, label, occurrences, etc.)'},
        enabled: {control: 'boolean', description: 'Whether the input is interactive'},
        index: {description: 'Occurrence index within the form'},
        errors: {description: 'Array of validation error objects'},
    },
};

export default meta;

type Story = StoryObj<TextLineInputProps>;

const defaultArgs: TextLineInputProps = {
    value: ValueTypes.STRING.newNullValue(),
    onChange: v => console.log('onChange', v.getString()),
    config: makeConfig(),
    input: makeInput(),
    enabled: true,
    index: 0,
    errors: [],
};

function StatefulTextLine(props: InputTypeComponentProps<TextLineConfig> & {initialValue?: Value}) {
    const {initialValue, onChange, ...rest} = props;
    const [value, setValue] = useState(initialValue ?? rest.value);

    const handleChange: InputTypeComponentProps<TextLineConfig>['onChange'] = nextValue => {
        setValue(nextValue);
        onChange(nextValue);
    };

    return <TextLineInput {...rest} value={value} onChange={handleChange} />;
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

export const Disabled: Story = {
    name: 'States / Disabled',
    args: {
        ...defaultArgs,
        value: ValueTypes.STRING.newValue('Cannot edit this'),
        enabled: false,
    },
};

export const ReadOnly: Story = {
    name: 'States / Read-Only',
    args: {
        ...defaultArgs,
        value: ValueTypes.STRING.newValue('Selectable but not editable'),
        readOnly: true,
    },
};

export const Processing: Story = {
    name: 'States / Processing',
    args: {
        ...defaultArgs,
        value: ValueTypes.STRING.newValue('Saving…'),
        processing: true,
        config: makeConfig({maxLength: 50, showCounter: true}),
    },
};

export const WithError: Story = {
    name: 'States / With Error',
    args: {
        ...defaultArgs,
        value: ValueTypes.STRING.newValue('bad'),
        errors: [{message: 'Value does not match the required pattern'}],
    },
};

export const WithMultipleErrors: Story = {
    name: 'States / Multiple Errors',
    args: {
        ...defaultArgs,
        value: ValueTypes.STRING.newValue('toolong-and-invalid'),
        errors: [
            {message: 'Value exceeds maximum length of 5'},
            {message: 'Value does not match the required pattern'},
        ],
    },
};

export const WithCounter: Story = {
    name: 'Examples / Only Counter',
    args: {
        ...defaultArgs,
        value: ValueTypes.STRING.newValue('Hello, world!'),
        config: makeConfig({showCounter: true}),
    },
    render: args => <StatefulTextLine {...args} />,
};

export const WithMaxLength: Story = {
    name: 'Examples / Max Length',
    args: {
        ...defaultArgs,
        value: ValueTypes.STRING.newValue('20 characters max.'),
        config: makeConfig({maxLength: 20}),
    },
    render: args => <StatefulTextLine {...args} />,
};

export const WithMaxLengthAndCounter: Story = {
    name: 'Examples / Max Length + Counter',
    args: {
        ...defaultArgs,
        value: ValueTypes.STRING.newValue('Hello, world!'),
        config: makeConfig({maxLength: 50, showCounter: true}),
    },
    render: args => <StatefulTextLine {...args} />,
};

function HighlightDemo() {
    const [highlight, setHighlight] = useState(0);

    const handleClick = () => setHighlight(count => count + 1);

    return (
        <div className='flex flex-col gap-y-3 p-4'>
            <div className='max-w-120 text-sm text-subtle'>
                Click the button to scroll the field into view and trigger a pulse animation.
            </div>
            <Button onClick={handleClick}>Highlight field</Button>
            <div className='h-96' />
            <TextLineInput {...defaultArgs} value={ValueTypes.STRING.newValue('Find me')} highlight={highlight} />
            <div className='h-96' />
        </div>
    );
}

export const Highlight: Story = {
    name: 'Features / Highlight',
    render: () => <HighlightDemo />,
};

const STORY_PATH = '.story.field';
const OCCURRENCE_ID = 'occurrence-0';

function WithRegistryDemo() {
    const registry = useMemo(() => new FieldRegistry(), []);
    const [token, setToken] = useState<ProcessingToken | null>(null);
    const [processing, setProcessing] = useState(false);
    const processingTokenRef = useRef<Map<string, ProcessingToken>>(new Map());

    useEffect(() => {
        const registration = registry.register(STORY_PATH, {
            setTransientError: () => false,
            clearTransientError: () => false,
            clearAllTransientErrors: () => undefined,
            getOccurrenceIds: () => [OCCURRENCE_ID],
            acquireProcessing: (occurrenceId: string) => {
                if (occurrenceId !== OCCURRENCE_ID) return null;
                if (processingTokenRef.current.has(occurrenceId)) return null;
                const t = generateProcessingToken();
                processingTokenRef.current.set(occurrenceId, t);
                setProcessing(true);
                return t;
            },
            releaseProcessing: (t: ProcessingToken) => {
                for (const [occId, stored] of processingTokenRef.current.entries()) {
                    if (stored === t) {
                        processingTokenRef.current.delete(occId);
                        setProcessing(false);
                        return true;
                    }
                }
                return false;
            },
            isProcessing: (occurrenceId: string) => processingTokenRef.current.has(occurrenceId),
            reveal: () => false,
            focus: () => false,
        });

        return () => registration.unregister();
    }, [registry]);

    const handleAcquire = () => {
        const t = registry.acquireProcessing(STORY_PATH, OCCURRENCE_ID);
        if (t != null) setToken(t);
    };

    const handleRelease = () => {
        if (token == null) return;
        registry.releaseProcessing(token);
        setToken(null);
    };

    return (
        <FieldRegistryProvider registry={registry}>
            <div className='flex flex-col gap-y-3 p-4'>
                <div className='max-w-120 text-sm text-subtle'>
                    Acquire a processing lock via the registry. The field becomes read-only and shows a spinner. Release
                    the lock to restore the normal state.
                </div>
                <TextLineInput
                    {...defaultArgs}
                    value={ValueTypes.STRING.newValue('Saving changes…')}
                    config={makeConfig({maxLength: 50, showCounter: true})}
                    readOnly={processing}
                    processing={processing}
                />
                <div className='flex gap-x-2'>
                    <Button onClick={handleAcquire} disabled={token != null}>
                        Acquire processing
                    </Button>
                    <Button onClick={handleRelease} disabled={token == null}>
                        Release processing
                    </Button>
                </div>
            </div>
        </FieldRegistryProvider>
    );
}

export const WithRegistry: Story = {
    name: 'Features / With Registry',
    render: () => <WithRegistryDemo />,
};

export const AllStates: Story = {
    name: 'States / All States',
    render: () => (
        <div className='w-80 space-y-6 p-4'>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Empty</h3>
                <TextLineInput {...defaultArgs} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>With Value</h3>
                <TextLineInput {...defaultArgs} value={ValueTypes.STRING.newValue('Hello, world!')} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Disabled</h3>
                <TextLineInput {...defaultArgs} value={ValueTypes.STRING.newValue('Cannot edit')} enabled={false} />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Read-Only</h3>
                <TextLineInput {...defaultArgs} value={ValueTypes.STRING.newValue('Read only')} readOnly />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Processing</h3>
                <TextLineInput {...defaultArgs} value={ValueTypes.STRING.newValue('Saving…')} processing />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Error</h3>
                <TextLineInput
                    {...defaultArgs}
                    value={ValueTypes.STRING.newValue('bad')}
                    errors={[{message: 'Value does not match the required pattern'}]}
                />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Max Length</h3>
                <TextLineInput
                    {...defaultArgs}
                    value={ValueTypes.STRING.newValue('Hello')}
                    config={makeConfig({maxLength: 20})}
                />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Max Length + Counter</h3>
                <TextLineInput
                    {...defaultArgs}
                    value={ValueTypes.STRING.newValue('Hello, world!')}
                    config={makeConfig({maxLength: 50, showCounter: true})}
                />
            </div>
        </div>
    ),
};
