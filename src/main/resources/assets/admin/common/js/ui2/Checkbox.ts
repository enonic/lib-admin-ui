import * as UI from "@enonic/ui";
import {LegacyElement} from "./LegacyElement";

export type CheckboxProps = Pick<
    UI.CheckboxProps,
        'checked' | 'state' | 'label' | 'onChange' | 'alignment' | 'partial'>
    & Partial<Pick<UI.CheckboxProps, 'name' | 'onFocus' | 'onBlur'>>;

export class Checkbox
    extends LegacyElement<typeof UI.Checkbox> {
    private internalChecked: boolean;
    private suppressChange: boolean = false;

    private readonly focusListeners: (() => void)[] = [];

    constructor(props: CheckboxProps) {
        super(
            {
                ...props,
                onChange: (checked: boolean) => {
                    this.internalChecked = checked;
                    this.setProps({checked});
                    if (!this.suppressChange) {
                        props.onChange?.(checked);
                    }
                },
                partial: props.partial,
                onFocus: () => this.focusListeners.forEach((l) => l()),
                onBlur: () => console.log('blur, final props →', this.props.get())
            },
            UI.Checkbox,
        );

        // initialize internal state and sync prop
        this.internalChecked = !!props.checked;
        this.setProps({checked: this.internalChecked});

        if (props.name) {
            this.setName(props.name);
        }
    }

    getName(): string {
        return this.props.get().name;
    }

    setName(name: string): this {
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
        return this.props.get().label ?? "";
    }

    setEnabled(enable: boolean): void {
        this.setProps({state: enable ? "default" : "disabled"});
    }

    isDisabled(): boolean {
        const {state} = this.props.get();
        return state === "disabled" || state === "readOnly";
    }

    toggleChecked(): void {
        this.setChecked(!this.isChecked());
    }

    clear(): void {
        this.setChecked(false);
    }

    setValue(value: string): Checkbox {
        // Match original behavior with warning
        if (UI.Checkbox["debug"]) {
            console.warn(
                "Checkbox.setValue sets the value attribute, you may have wanted to use setChecked instead",
            );
        }
        this.setChecked(value === "true");
        return this;
    }

    getValue(): string {
        // Match original behavior with warning
        if (UI.Checkbox["debug"]) {
            console.warn(
                "Checkbox.getValue gets the value attribute, you may have wanted to use getChecked instead",
            );
        }
        return String(this.isChecked());
    }

    giveFocus(): boolean {
        const input = this.getHTMLElement().querySelector(
            'input[type="checkbox"]',
        );
        if (input instanceof HTMLElement) {
            input.focus();
            return true;
        }
        return super.giveFocus();
    }

    giveBlur(): boolean {
        const input = this.getHTMLElement().querySelector(
            'input[type="checkbox"]',
        );
        if (input instanceof HTMLElement) {
            input.blur();
            return true;
        }
        return false;
    }

    setPartial(value: boolean): void {
        // Add a class to handle partial state
        this.toggleClass("partial", value);
    }

    isPartial(): boolean {
        return this.hasClass("partial");
    }


    onFocus(listener: (event: FocusEvent) => void): void {
        const input = this.getHTMLElement().querySelector(
            'input[type="checkbox"]',
        );
        if (input) {
            input.addEventListener("focus", listener);
        }
    }

    onBlur(listener: (event: FocusEvent) => void): void {
        const input = this.getHTMLElement().querySelector(
            'input[type="checkbox"]',
        );
        if (input) {
            input.addEventListener("blur", listener);
        }
    }
}
