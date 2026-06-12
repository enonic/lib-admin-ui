import {cn, Button as UIButton} from '@enonic/ui';
import type {Meta, StoryObj} from '@storybook/preact-vite';
import {type ReactElement, useEffect, useRef, useState} from 'react';
import {LegacyElement} from './LegacyElement';

const meta: Meta = {
    title: 'ui2/LegacyElement',
    parameters: {layout: 'centered'},
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

type GreetingProps = {
    name: string;
    className?: string;
};

const Greeting = ({name, className}: GreetingProps): ReactElement => (
    <div className={cn('rounded-sm border border-bdr-subtle px-4 py-2 transition-opacity', className)}>
        Hello, {name}!
    </div>
);

Greeting.displayName = 'Greeting';

class GreetingElement extends LegacyElement<typeof Greeting> {
    constructor(props: GreetingProps) {
        super(props, Greeting);
    }
}

function LegacyHost({create}: {create: () => GreetingElement}): ReactElement {
    const holderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = create();
        holderRef.current?.appendChild(element.getHTMLElement());

        return () => {
            element.remove();
        };
    }, [create]);

    return <div ref={holderRef} />;
}

export const Default: Story = {
    name: 'Examples / Default',
    render: () => (
        <div className='flex flex-col items-center gap-y-3 p-4'>
            <div className='max-w-120 text-sm text-subtle'>
                LegacyElement bridges the legacy Element API and Preact: the Greeting component below is rendered by a
                legacy Element subclass mounted into the story DOM.
            </div>
            <LegacyHost create={() => new GreetingElement({name: 'World'})} />
        </div>
    ),
};

const NAMES = ['World', 'Enonic', 'Storybook', 'Preact'];

function BridgeDemo(): ReactElement {
    const holderRef = useRef<HTMLDivElement>(null);
    const elementRef = useRef<GreetingElement | null>(null);
    const [nameIndex, setNameIndex] = useState(0);
    const [dimmed, setDimmed] = useState(false);

    useEffect(() => {
        const element = new GreetingElement({name: NAMES[0], className: ''});
        elementRef.current = element;
        holderRef.current?.appendChild(element.getHTMLElement());

        return () => {
            elementRef.current = null;
            element.remove();
        };
    }, []);

    const handleRename = () => {
        const next = (nameIndex + 1) % NAMES.length;
        elementRef.current?.setProps({name: NAMES[next]});
        setNameIndex(next);
    };

    const handleToggleDim = () => {
        const element = elementRef.current;
        if (element == null) return;

        if (dimmed) {
            element.removeClass('opacity-50');
        } else {
            element.addClass('opacity-50');
        }
        setDimmed(!dimmed);
    };

    return (
        <div className='flex flex-col items-center gap-y-3 p-4'>
            <div className='max-w-120 text-sm text-subtle'>
                Legacy code drives the Preact component through the Element API: setProps re-renders it, while addClass
                and removeClass update its className prop.
            </div>
            <div ref={holderRef} />
            <div className='flex items-center gap-2'>
                <UIButton label='Next name' variant='outline' size='sm' onClick={handleRename} />
                <UIButton label={dimmed ? 'Restore' : 'Dim'} variant='outline' size='sm' onClick={handleToggleDim} />
            </div>
        </div>
    );
}

export const LegacyApiBridge: Story = {
    name: 'Behavior / Legacy API Bridge',
    render: () => <BridgeDemo />,
};
