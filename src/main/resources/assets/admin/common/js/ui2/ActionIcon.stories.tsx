import type {Meta, StoryObj} from '@storybook/preact-vite';
import {Pencil, Plus, Settings, Trash2} from 'lucide-react';
import {type ReactElement, useEffect, useRef} from 'react';
import {Action} from '../ui/Action';
import {ActionIcon} from './ActionIcon';

const meta: Meta = {
    title: 'ui2/ActionIcon',
    parameters: {layout: 'centered'},
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

function makeAction(label: string, shortcut?: string): Action {
    const action = new Action(label, shortcut);
    action.onExecuted(() => console.log(`Action executed: ${label}`));
    return action;
}

function LegacyHost({create}: {create: () => ActionIcon}): ReactElement {
    const holderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const icon = create();
        holderRef.current?.appendChild(icon.getHTMLElement());

        return () => {
            icon.remove();
        };
    }, [create]);

    return <div ref={holderRef} />;
}

export const Default: Story = {
    name: 'Examples / Default',
    render: () => <LegacyHost create={() => new ActionIcon({action: makeAction('Edit'), icon: Pencil})} />,
};

export const CommonActions: Story = {
    name: 'Examples / Common Actions',
    render: () => (
        <div className='flex items-center gap-2'>
            <LegacyHost create={() => new ActionIcon({action: makeAction('Add'), icon: Plus})} />
            <LegacyHost create={() => new ActionIcon({action: makeAction('Edit'), icon: Pencil})} />
            <LegacyHost create={() => new ActionIcon({action: makeAction('Delete'), icon: Trash2})} />
            <LegacyHost create={() => new ActionIcon({action: makeAction('Settings'), icon: Settings})} />
        </div>
    ),
};

export const WithShortcut: Story = {
    name: 'Examples / With Shortcut',
    render: () => (
        <div className='flex flex-col items-center gap-y-3 p-4'>
            <div className='max-w-120 text-sm text-subtle'>
                Hover the icon: the tooltip shows the action label together with its shortcut, formatted for the current
                platform.
            </div>
            <LegacyHost create={() => new ActionIcon({action: makeAction('Edit', 'mod+e'), icon: Pencil})} />
        </div>
    ),
};

export const Disabled: Story = {
    name: 'States / Disabled',
    render: () => (
        <LegacyHost create={() => new ActionIcon({action: makeAction('Delete').setEnabled(false), icon: Trash2})} />
    ),
};
