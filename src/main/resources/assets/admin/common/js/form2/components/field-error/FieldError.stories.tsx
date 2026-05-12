import type {Meta, StoryObj} from '@storybook/preact-vite';
import {useState} from 'react';
import {FieldError} from './FieldError';

const meta: Meta<typeof FieldError> = {
    title: 'Form/FieldError',
    component: FieldError,
    parameters: {layout: 'centered'},
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof FieldError>;

export const Default: Story = {
    name: 'Examples / Default',
    render: () => <FieldError message='Value does not match the required pattern' />,
};

export const LongMessage: Story = {
    name: 'Examples / Long Message',
    render: () => (
        <div className='w-64'>
            <FieldError message='This is a much longer error message that wraps to multiple lines to verify the icon stays aligned at the top of the text block' />
        </div>
    ),
};

export const NoMessage: Story = {
    name: 'States / No Message',
    render: () => <FieldError message={undefined} />,
};

function DismissibleDemo() {
    const [visible, setVisible] = useState(true);

    if (!visible) {
        return (
            <div className='flex flex-col gap-y-3 p-4'>
                <div className='max-w-120 text-sm text-subtle'>Dismissed. Reload the story to bring it back.</div>
            </div>
        );
    }

    return (
        <div className='flex flex-col gap-y-3 p-4'>
            <div className='max-w-120 text-sm text-subtle'>
                Click the X to dismiss. The `onDismiss` prop renders the close affordance and lets the parent clear the
                message — used for transient errors (e.g. translation failures).
            </div>
            <FieldError message='Translation failed for this field' onDismiss={() => setVisible(false)} />
        </div>
    );
}

export const Dismissible: Story = {
    name: 'Features / Dismissible',
    render: () => <DismissibleDemo />,
};

export const AllVariants: Story = {
    name: 'States / All Variants',
    render: () => (
        <div className='w-80 space-y-6 p-4'>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Required field</h3>
                <FieldError message='This field is required' />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Occurrence min breach</h3>
                <FieldError message='At least 2 occurrences are required' />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>Occurrence max breach</h3>
                <FieldError message='Maximum 3 occurrences allowed' />
            </div>
            <div>
                <h3 className='mb-3 font-medium text-sm'>No error (renders nothing)</h3>
                <FieldError message={undefined} />
            </div>
        </div>
    ),
};
