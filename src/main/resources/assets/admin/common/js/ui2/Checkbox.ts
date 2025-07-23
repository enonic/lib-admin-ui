import * as UI from '@enonic/ui';

import {LegacyElement} from './LegacyElement';

export interface CheckboxProps {
    className?: string;
    label: string;
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export class Checkbox
    extends LegacyElement<typeof UI.Checkbox> {
    private internalChecked: boolean;
    private suppressChange: boolean = false;

    private getProps(): CheckboxProps {
        return this.props.get() as CheckboxProps;
    }

    constructor(props: CheckboxProps) {
        super(
            {
                ...props,
                // ensure controlled update of checked
                checked: !!props.checked,
                onChange: (checked: boolean) => {
                    this.internalChecked = checked;
                    // update underlying UI.Checkbox
                    this.setProps({checked});
                    // notify external listener if not suppressed
                    if (!this.suppressChange) {
                        props.onChange?.(checked);
                    }
                },
            },
            UI.Checkbox,
        );

        // initialize internal state and sync prop
        this.internalChecked = !!props.checked;
        this.setProps({checked: this.internalChecked});
    }

    isChecked(): boolean {
        return this.internalChecked;
    }

    setChecked(checked: boolean, suppressEvent: boolean = false): void {
        this.suppressChange = suppressEvent;
        this.internalChecked = checked;
        this.setProps({checked});
        this.suppressChange = false;
    }

    setLabel(label: string): void {
        this.setProps({label});
    }

    getLabel(): string {
        return (this.getProps() as CheckboxProps).label ?? '';
    }

    setEnabled(enable: boolean): void {
        this.setProps({disabled: !enable});
    }

    isDisabled(): boolean {
        return (this.getProps() as CheckboxProps).disabled ?? false;
    }
}
