import {Button as UIButton} from '@enonic/ui';
import type {Meta, StoryObj} from '@storybook/preact-vite';
import {type ReactElement, useEffect, useRef, useState} from 'react';
import {Checkbox} from './Checkbox';

const meta: Meta = {
    title: 'ui2/Checkbox',
    parameters: {layout: 'centered'},
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

function LegacyHost({create}: {create: () => Checkbox}): ReactElement {
    const holderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkbox = create();
        holderRef.current?.appendChild(checkbox.getHTMLElement());

        return () => {
            checkbox.remove();
        };
    }, [create]);

    return <div ref={holderRef} />;
}

export const Default: Story = {
    name: 'Examples / Default',
    render: () => <LegacyHost create={() => new Checkbox({label: 'Accept terms'})} />,
};

export const Checked: Story = {
    name: 'Examples / Checked',
    render: () => <LegacyHost create={() => new Checkbox({label: 'Subscribe to newsletter'}).setChecked(true, true)} />,
};

export const Indeterminate: Story = {
    name: 'Examples / Indeterminate',
    render: () => <LegacyHost create={() => new Checkbox({label: 'Select all'}).setChecked('indeterminate', true)} />,
};

export const AlignRight: Story = {
    name: 'Examples / Align Right',
    render: () => <LegacyHost create={() => new Checkbox({label: 'Enable notifications', align: 'right'})} />,
};

function LegacyApiDemo(): ReactElement {
    const holderRef = useRef<HTMLDivElement>(null);
    const checkboxRef = useRef<Checkbox | null>(null);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const checkbox = new Checkbox({
            label: 'Receive product updates',
            onCheckedChange: value => setChecked(value === true),
        });
        checkboxRef.current = checkbox;
        holderRef.current?.appendChild(checkbox.getHTMLElement());

        return () => {
            checkboxRef.current = null;
            checkbox.remove();
        };
    }, []);

    const syncChecked = () => setChecked(checkboxRef.current?.isChecked() ?? false);

    const handleToggle = () => {
        checkboxRef.current?.toggleChecked();
        syncChecked();
    };

    const handleClear = () => {
        checkboxRef.current?.clear();
        syncChecked();
    };

    return (
        <div className='flex flex-col items-center gap-y-3 p-4'>
            <div className='max-w-120 text-sm text-subtle'>
                External code drives the checkbox through the legacy API, and user changes flow back through
                onCheckedChange.
            </div>
            <div ref={holderRef} />
            <div className='flex items-center gap-2'>
                <UIButton label='Toggle' variant='outline' size='sm' onClick={handleToggle} />
                <UIButton label='Clear' variant='outline' size='sm' onClick={handleClear} />
            </div>
            <div className='text-sm text-subtle'>Checked: {String(checked)}</div>
        </div>
    );
}

export const LegacyApi: Story = {
    name: 'Behavior / Legacy API',
    render: () => <LegacyApiDemo />,
};
