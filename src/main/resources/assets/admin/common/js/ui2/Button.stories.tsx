import type {Meta, StoryObj} from '@storybook/preact-vite';
import {ArrowRight, Plus} from 'lucide-react';
import {type ReactElement, useEffect, useRef, useState} from 'react';
import {Button} from './Button';

const meta: Meta = {
    title: 'ui2/Button',
    parameters: {layout: 'centered'},
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

function LegacyHost({create}: {create: () => Button}): ReactElement {
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
    render: () => <LegacyHost create={() => new Button({label: 'Save'})} />,
};

export const Variants: Story = {
    name: 'Examples / Variants',
    render: () => (
        <div className='flex items-center gap-3'>
            <LegacyHost create={() => new Button({label: 'Text', variant: 'text'})} />
            <LegacyHost create={() => new Button({label: 'Filled', variant: 'filled'})} />
            <LegacyHost create={() => new Button({label: 'Solid', variant: 'solid'})} />
            <LegacyHost create={() => new Button({label: 'Outline', variant: 'outline'})} />
        </div>
    ),
};

export const Sizes: Story = {
    name: 'Examples / Sizes',
    render: () => (
        <div className='flex items-center gap-3'>
            <LegacyHost create={() => new Button({label: 'Small', size: 'sm'})} />
            <LegacyHost create={() => new Button({label: 'Medium', size: 'md'})} />
            <LegacyHost create={() => new Button({label: 'Large', size: 'lg'})} />
        </div>
    ),
};

export const WithIcons: Story = {
    name: 'Examples / With Icons',
    render: () => (
        <div className='flex items-center gap-3'>
            <LegacyHost create={() => new Button({label: 'Add item', startIcon: Plus})} />
            <LegacyHost create={() => new Button({label: 'Continue', endIcon: ArrowRight})} />
        </div>
    ),
};

export const Disabled: Story = {
    name: 'States / Disabled',
    render: () => <LegacyHost create={() => new Button({label: 'Save', disabled: true})} />,
};

function ImperativeUpdatesDemo(): ReactElement {
    const holderRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<Button | null>(null);
    const [clicks, setClicks] = useState(0);

    useEffect(() => {
        const button = new Button({label: 'Click me', onClick: () => setClicks(count => count + 1)});
        buttonRef.current = button;
        holderRef.current?.appendChild(button.getHTMLElement());

        return () => {
            buttonRef.current = null;
            button.remove();
        };
    }, []);

    useEffect(() => {
        if (clicks > 0) buttonRef.current?.setProps({label: `Clicked ${clicks} times`});
    }, [clicks]);

    return (
        <div className='flex flex-col items-center gap-y-3 p-4'>
            <div className='max-w-120 text-sm text-subtle'>
                The legacy instance updates its own label through setProps after every click.
            </div>
            <div ref={holderRef} />
        </div>
    );
}

export const ImperativeUpdates: Story = {
    name: 'Behavior / Imperative Updates',
    render: () => <ImperativeUpdatesDemo />,
};
