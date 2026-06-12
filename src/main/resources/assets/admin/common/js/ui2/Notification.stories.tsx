import {Button} from '@enonic/ui';
import type {Meta, StoryObj} from '@storybook/preact-vite';
import {type ReactElement, useState} from 'react';
import {Notification} from './Notification';

const meta: Meta<typeof Notification> = {
    title: 'ui2/Notification',
    component: Notification,
    parameters: {layout: 'centered'},
    tags: ['autodocs'],
    argTypes: {
        tone: {control: 'select', options: ['success', 'info', 'warning', 'error']},
    },
    args: {
        text: 'New version is available.',
        tone: 'info',
        actions: [],
    },
};

export default meta;

type Story = StoryObj<typeof Notification>;

export const Default: Story = {
    name: 'Examples / Default',
};

export const Tones: Story = {
    name: 'Examples / Tones',
    render: () => (
        <div className='flex flex-col gap-y-3'>
            <Notification text='Application installed successfully.' tone='success' actions={[]} />
            <Notification text='New version is available.' tone='info' actions={[]} />
            <Notification text='The connection is unstable.' tone='warning' actions={[]} />
            <Notification text='Failed to install the application.' tone='error' actions={[]} />
        </div>
    ),
};

export const WithActions: Story = {
    name: 'Examples / With Actions',
    args: {
        text: 'Item moved to trash.',
        tone: 'info',
        actions: [
            {label: 'Undo', onClick: () => console.log('Undo clicked')},
            {label: 'Details', onClick: () => console.log('Details clicked')},
        ],
    },
};

export const WithCloseButton: Story = {
    name: 'Examples / With Close Button',
    args: {
        text: 'Settings saved.',
        tone: 'success',
        actions: [],
        withClose: true,
    },
};

export const LongText: Story = {
    name: 'States / Long Text',
    args: {
        text: 'The application could not be installed because the repository is unreachable. Check your network connection and try again, or contact the administrator if the problem persists.',
        tone: 'error',
        actions: [],
    },
};

function DismissDemo(): ReactElement {
    const [open, setOpen] = useState(true);

    return (
        <div className='flex flex-col items-center gap-y-3 p-4'>
            <div className='max-w-120 text-sm text-subtle'>
                Close the notification with the X button, then bring it back.
            </div>
            {open ? (
                <Notification
                    text='Settings saved.'
                    tone='success'
                    actions={[]}
                    withClose
                    open={open}
                    onOpenChange={setOpen}
                />
            ) : (
                <Button label='Show notification' variant='outline' size='sm' onClick={() => setOpen(true)} />
            )}
        </div>
    );
}

export const Dismissible: Story = {
    name: 'Features / Dismissible',
    render: () => <DismissDemo />,
};
