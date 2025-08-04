import * as UI from "@enonic/ui";
import {LegacyElement} from "./LegacyElement";

export type CheckboxControllerProps = Pick<
        UI.CheckboxProps,
        'checked' | 'label' | 'align'>
    & Partial<Pick<UI.CheckboxProps, 'onCheckedChange' | 'name' | 'onFocus' | 'onBlur'>>;

export class Checkbox
    extends LegacyElement<typeof UI.Checkbox> {

    private currentChecked: boolean | 'indeterminate';
    private suppressEvent = false;

    //private readonly focusListeners: (() => void)[] = [];

    constructor(props: CheckboxControllerProps) {
        super(
            {
                ...props,
                onCheckedChange: (newValue) => {
                    this.currentChecked = newValue;
                    this.setProps({checked: newValue});
                    if (!this.suppressEvent) {
                        props.onCheckedChange?.(newValue);
                    }
                },
                //onFocus: () => this.focusListeners.forEach((l) => l()),
                //onBlur: () => this.props.get())

            },
            UI.Checkbox,
        );

        // initialize internal state and sync prop
        this.currentChecked = props.checked ?? false;
        this.setProps({checked: this.currentChecked, align: props.align});
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
        return this.currentChecked === true;
    }

    isIndeterminate(): boolean {
        return this.currentChecked === 'indeterminate';
    }

    setChecked(
        value: boolean | 'indeterminate',
        suppressEvent = false
    ): this {
        this.suppressEvent = suppressEvent;
        this.currentChecked = value;
        this.setProps({checked: value});
        this.suppressEvent = false;
        return this;
    }

    setLabel(label: string): this {
        this.setProps({label});
        return this;
    }

    getLabel(): string {
        return this.props.get().label ?? "";
    }

    /*
        setEnabled(enable: boolean): void {
            this.setProps({state: enable ? "default" : "disabled"});
        }

        isDisabled(): boolean {
            const {state} = this.props.get();
            return state === "disabled" || state === "readOnly";
        }
    */
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


    /*
  onFocus(fn: () => void): this {
    this.setProps({ onFocus: fn });
    return this;
  }

  onBlur(fn: () => void): this {
    this.setProps({ onBlur: fn });
    return this;
  }
  */
}
