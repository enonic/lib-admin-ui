import type {Meta, StoryObj} from '@storybook/preact-vite';
import {type ReactElement, useEffect, useRef, useState} from 'react';
import {SearchInputComponent} from './SearchInput';

const meta: Meta = {
    title: 'ui2/SearchInput',
    parameters: {layout: 'centered'},
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

function LegacyHost({create}: {create: () => SearchInputComponent}): ReactElement {
    const holderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const input = create();
        holderRef.current?.appendChild(input.getHTMLElement());

        return () => {
            input.remove();
        };
    }, [create]);

    return <div ref={holderRef} className='w-80' />;
}

export const Default: Story = {
    name: 'Examples / Default',
    render: () => <LegacyHost create={() => new SearchInputComponent({})} />,
};

export const CustomPlaceholder: Story = {
    name: 'Examples / Custom Placeholder',
    render: () => <LegacyHost create={() => new SearchInputComponent({placeholder: 'Search applications...'})} />,
};

export const InitialValue: Story = {
    name: 'Examples / Initial Value',
    render: () => <LegacyHost create={() => new SearchInputComponent({defaultValue: 'enonic'})} />,
};

export const Disabled: Story = {
    name: 'States / Disabled',
    render: () => <LegacyHost create={() => new SearchInputComponent({disabled: true})} />,
};

export const ReadOnly: Story = {
    name: 'States / Read Only',
    render: () => <LegacyHost create={() => new SearchInputComponent({readOnly: true, defaultValue: 'enonic'})} />,
};

function ValueTrackingDemo(): ReactElement {
    const holderRef = useRef<HTMLDivElement>(null);
    const [value, setValue] = useState('');

    useEffect(() => {
        const input = new SearchInputComponent({onChange: setValue});
        holderRef.current?.appendChild(input.getHTMLElement());

        return () => {
            input.remove();
        };
    }, []);

    return (
        <div className='flex flex-col items-center gap-y-3 p-4'>
            <div className='max-w-120 text-sm text-subtle'>
                Type into the field: changes propagate to the host through onChange, mirroring what getValue() returns
                on the legacy instance.
            </div>
            <div ref={holderRef} className='w-80' />
            <div className='text-sm text-subtle'>Current value: {value === '' ? '(empty)' : value}</div>
        </div>
    );
}

export const ValueTracking: Story = {
    name: 'Behavior / Value Tracking',
    render: () => <ValueTrackingDemo />,
};
