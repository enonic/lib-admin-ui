import {Button as UIButton} from '@enonic/ui';
import type {Meta, StoryObj} from '@storybook/preact-vite';
import {ArrowRight, Plus} from 'lucide-react';
import {type ReactElement, useEffect, useRef, useState} from 'react';
import {Action} from '../ui/Action';
import {ActionButton} from './ActionButton';

const meta: Meta = {
    title: 'ui2/ActionButton',
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

function LegacyHost({create}: {create: () => ActionButton}): ReactElement {
    const holderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const button = create();
        holderRef.current?.appendChild(button.getHTMLElement());

        return () => {
            button.remove();
        };
    }, [create]);

    return <div ref={holderRef} />;
}

export const Default: Story = {
    name: 'Examples / Default',
    render: () => <LegacyHost create={() => new ActionButton({action: makeAction('Save')})} />,
};

export const VariantsAndIcons: Story = {
    name: 'Examples / Variants and Icons',
    render: () => (
        <div className='flex items-center gap-3'>
            <LegacyHost create={() => new ActionButton({action: makeAction('Add item'), startIcon: Plus})} />
            <LegacyHost
                create={() => new ActionButton({action: makeAction('Continue'), endIcon: ArrowRight, variant: 'solid'})}
            />
            <LegacyHost create={() => new ActionButton({action: makeAction('Cancel'), variant: 'outline'})} />
        </div>
    ),
};

export const WithShortcut: Story = {
    name: 'Examples / With Shortcut',
    render: () => (
        <div className='flex flex-col items-center gap-y-3 p-4'>
            <div className='max-w-120 text-sm text-subtle'>
                Hover the button: the title contains the action shortcut, formatted for the current platform.
            </div>
            <LegacyHost create={() => new ActionButton({action: makeAction('Save', 'mod+s')})} />
        </div>
    ),
};

export const Disabled: Story = {
    name: 'States / Disabled',
    render: () => <LegacyHost create={() => new ActionButton({action: makeAction('Delete').setEnabled(false)})} />,
};

function ActionDrivenDemo(): ReactElement {
    const holderRef = useRef<HTMLDivElement>(null);
    const actionRef = useRef<Action | null>(null);
    const [enabled, setEnabled] = useState(true);
    const [renames, setRenames] = useState(0);

    useEffect(() => {
        const action = makeAction('Publish');
        actionRef.current = action;

        const button = new ActionButton({action});
        holderRef.current?.appendChild(button.getHTMLElement());

        return () => {
            actionRef.current = null;
            button.remove();
        };
    }, []);

    const handleToggleEnabled = () => {
        const action = actionRef.current;
        if (action == null) return;

        action.setEnabled(!action.isEnabled());
        setEnabled(action.isEnabled());
    };

    const handleRename = () => {
        const next = renames + 1;
        actionRef.current?.setLabel(`Publish (${next})`);
        setRenames(next);
    };

    return (
        <div className='flex flex-col items-center gap-y-3 p-4'>
            <div className='max-w-120 text-sm text-subtle'>
                The button listens to its Action: renaming or disabling the action immediately updates the rendered
                button.
            </div>
            <div ref={holderRef} />
            <div className='flex items-center gap-2'>
                <UIButton
                    label={enabled ? 'Disable action' : 'Enable action'}
                    variant='outline'
                    size='sm'
                    onClick={handleToggleEnabled}
                />
                <UIButton label='Rename action' variant='outline' size='sm' onClick={handleRename} />
            </div>
        </div>
    );
}

export const ActionDriven: Story = {
    name: 'Behavior / Action Driven',
    render: () => <ActionDrivenDemo />,
};
