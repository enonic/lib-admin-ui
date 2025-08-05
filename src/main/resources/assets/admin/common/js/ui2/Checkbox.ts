import * as UI from '@enonic/ui';
import {nanoid} from 'nanoid';
import {LegacyElement} from './LegacyElement';

export type CheckboxControllerProps = Pick<UI.CheckboxProps, 'checked' | 'label' | 'align'>
    & Partial<Pick<UI.CheckboxProps, 'onCheckedChange' | 'name'>>;

export class Checkbox
    extends LegacyElement<typeof UI.Checkbox> {

    private currentChecked: UI.CheckboxChecked;
    private suppressEvent = false;

    constructor(props: CheckboxControllerProps) {
        super(
            {
                id: nanoid(8),
                ...props,
                checked: props.checked ?? false,
                onCheckedChange: (newValue) => {
                    this.currentChecked = newValue;
                    this.setProps({checked: newValue});
                    if (!this.suppressEvent) {
                        props.onCheckedChange?.(newValue);
                    }
                },

            },
            UI.Checkbox,
        );

        this.currentChecked = this.props.get().checked ?? false;
    }

    // * Backward compatibility methods

    getName(): string {
        return this.props.get().name ?? '';
    }

    setName(name: string): this {
        this.props.setKey('name', name);
        return this;
    }

    getLabel(): string {
        return this.props.get().label ?? '';
    }

    setLabel(label: string): this {
        this.props.setKey('label', label)
        return this;
    }

    isChecked(): boolean {
        return this.currentChecked === true;
    }

    setChecked(checked: UI.CheckboxChecked, suppressEvent = false): this {
        this.suppressEvent = suppressEvent;

        this.currentChecked = checked;
        this.props.setKey('checked', checked);
        this.suppressEvent = false;

        return this;
    }

    toggleChecked(suppressEvent = false): void {
        this.setChecked(!this.isChecked(), suppressEvent);
    }

    clear(suppressEvent = false): void {
        this.setChecked(false, suppressEvent);
    }

    giveFocus(): boolean {
        const input = this.getHTMLElement().querySelector('input[type="checkbox"]');
        if (input instanceof HTMLInputElement) {
            input.focus();
            return true;
        }
        return false;
    }

    giveBlur(): boolean {
        const input = this.getHTMLElement().querySelector('input[type="checkbox"]');
        if (input instanceof HTMLInputElement) {
            input.blur();
            return true;
        }
        return false;
    }
}
