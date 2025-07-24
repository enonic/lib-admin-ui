import * as UI from '@enonic/ui';
import {InputEl} from '../dom/InputEl';
import {LegacyElement} from './LegacyElement';

export interface CheckboxProps {
    className?: string;
    label: string;
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    size?: 'sm' | 'md' | 'lg';
    state?: 'default' | 'error' | 'readOnly' | 'disabled';
    id?: string;
    name?: string;
}

export class Checkbox
    extends LegacyElement<typeof UI.Checkbox> {
    private internalChecked: boolean;
    private suppressChange: boolean = false;
    private name: string;
    private inputEl: InputEl;

    private getProps(): CheckboxProps {
        return this.props.get() as CheckboxProps;
    }

    constructor(props: CheckboxProps) {

        const inputEl = new InputEl('', 'checkbox');
        const generatedId = props.id || inputEl.getId();

        super(
            {
                ...props,
                id: generatedId,
                checked: !!props.checked,
                state: props.state ?? 'default',
                onChange: (checked: boolean) => {
                    this.internalChecked = checked;
                    this.setProps({checked});
                    if (!this.suppressChange) {
                        props.onChange?.(checked);
                    }
                },
            },
            UI.Checkbox,
        );

        // initialize internal state and sync prop
        this.inputEl = inputEl;
        this.internalChecked = !!props.checked;
        this.setProps({checked: this.internalChecked});

        if (props.name) {
            this.setName(props.name);
        }
    }

    getName(): string {
        return this.name || '';
    }

    setName(name: string): this {
        this.name = name;
        this.setProps({name});
        return this;
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

    setLabel(label: string): Checkbox {
        this.setProps({label});
        return this;
    }

    getLabel(): string {
        return (this.getProps() as CheckboxProps).label ?? '';
    }

    setEnabled(enable: boolean): void {
        this.setProps({state: enable ? 'default' : 'disabled'});
    }

    isDisabled(): boolean {
        const {state} = this.getProps() as CheckboxProps;
        return state === 'disabled' || state === 'readOnly';
    }

    toggleChecked(): void {
        this.setChecked(!this.isChecked());
    }

    clear(): void {
        this.setChecked(false);
    }

    setValue(value: string): Checkbox {
        // Match original behavior with warning
        if (UI.Checkbox['debug']) {
            console.warn('Checkbox.setValue sets the value attribute, you may have wanted to use setChecked instead');
        }
        this.setChecked(value === 'true');
        return this;
    }

    getValue(): string {
        // Match original behavior with warning
        if (UI.Checkbox['debug']) {
            console.warn('Checkbox.getValue gets the value attribute, you may have wanted to use getChecked instead');
        }
        return String(this.isChecked());
    }

    giveFocus(): boolean {
        const input = this.getHTMLElement().querySelector('input[type="checkbox"]');
        if (input instanceof HTMLElement) {
            input.focus();
            return true;
        }
        return super.giveFocus();
    }

    giveBlur(): boolean {
        const input = this.getHTMLElement().querySelector('input[type="checkbox"]');
        if (input instanceof HTMLElement) {
            input.blur();
            return true;
        }
        return false;
    }

    setPartial(value: boolean): void {
        // Add a class to handle partial state
        this.toggleClass('partial', value);
    }

    isPartial(): boolean {
        return this.hasClass('partial');
    }

    setPlaceholder(value: string): Checkbox {
        // UI.Checkbox might not support placeholder directly
        // But we'll add it for API compatibility
        this.setProps({placeholder: value} as any);
        return this;
    }

    getPlaceholder(): string {
        return (this.getProps() as any).placeholder || '';
    }

    // Event handlers for focus/blur
    onFocus(listener: (event: FocusEvent) => void): void {
        const input = this.getHTMLElement().querySelector('input[type="checkbox"]');
        if (input) {
            input.addEventListener('focus', listener);
        }
    }

    unFocus(listener: (event: FocusEvent) => void): void {
        const input = this.getHTMLElement().querySelector('input[type="checkbox"]');
        if (input) {
            input.removeEventListener('focus', listener);
        }
    }

    onBlur(listener: (event: FocusEvent) => void): void {
        const input = this.getHTMLElement().querySelector('input[type="checkbox"]');
        if (input) {
            input.addEventListener('blur', listener);
        }
    }

    unBlur(listener: (event: FocusEvent) => void): void {
        const input = this.getHTMLElement().querySelector('input[type="checkbox"]');
        if (input) {
            input.removeEventListener('blur', listener);
        }
    }
}
