import Q from 'q';
import {DivEl} from '../../dom/DivEl';
import {Element} from '../../dom/Element';
import {FormEl} from '../../dom/FormEl';
import {StyleHelper} from '../../StyleHelper';
import {AppHelper} from '../../util/AppHelper';
import {i18n} from '../../util/Messages';
import {Button} from '../button/Button';
import {KeyHelper} from '../KeyHelper';
import {TextInput} from '../text/TextInput';

export class PickerBuilder {
    inputPlaceholder: string = '';
}

export abstract class PickerPopup
    extends DivEl {

    private readonly submitButton: Button;

    protected constructor(className?: string) {
        super(className);

        this.submitButton = this.createSubmitButton();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendPopupElements();
            return rendered;
        });
    }

    show(): void {
        super.resolveDropdownPosition();
        super.show();
    }

    protected createSubmitButton(): Button {
        const button: Button = new Button(i18n('action.ok'));
        button.addClass('ok-button');
        button.onClicked(() => this.hide());

        return button;
    }

    getSubmitButton(): Button {
        return this.submitButton;
    }

    protected getChildElements(): Element[] {
        return [this.submitButton];
    }

    onSubmit(listener: () => void): void {
        this.submitButton.onClicked(listener);
    }

    private appendPopupElements(): void {
        this.appendChildren(...this.getChildElements());
    }
}

export abstract class Picker<T extends PickerPopup>
    extends DivEl {

    protected builder: PickerBuilder;

    protected popup: T;

    protected input: TextInput;

    protected validUserInput: boolean = true;

    protected constructor(builder: PickerBuilder, className?: string) {
        super(className);

        this.builder = builder;
        this.appendInput();
    }

    public resetBase(): void {
        this.input.resetBaseValues();
    }

    clear(): void {
        this.input.clear();
    }

    getTextInput(): TextInput {
        return this.input;
    }

    isDirty(): boolean {
        return this.input.isDirty();
    }

    isValid(): boolean {
        return this.validUserInput;
    }

    updateInputStyling(): void {
        this.input.updateValidationStatusOnUserInput(this.validUserInput);
    }

    giveFocus(): boolean {
        return this.input.giveFocus();
    }

    setEnabled(enable: boolean): void {
        this.input.setEnabled(enable);
    }

    protected setupPopupListeners(): void {
        this.popup.onShown(() => this.addClass('expanded'));
        this.popup.onHidden(() => this.removeClass('expanded'));

        // Prevent focus loss on mouse down
        this.popup.onMouseDown((event: MouseEvent) => event.preventDefault());

        this.popup.onKeyDown((event: KeyboardEvent) => {
            if (KeyHelper.isTabKey(event)) {
                if (!(document.activeElement === this.input.getEl().getHTMLElement())) {
                    this.hidePopup();
                }
            }
        });
    }

    protected setupInputListeners(): void {
        AppHelper.focusInOut(this, () => this.hidePopup(), 50, false);

        let isFocusHandlerRunning = false;
        this.input.onClicked((e: MouseEvent) => {
            if (isFocusHandlerRunning) {
                isFocusHandlerRunning = false;
                return;
            }

            this.togglePopupVisibility();
        });

        this.input.onFocus((e: FocusEvent) => {
            isFocusHandlerRunning = true;

            if (!this.popup || !this.popup.isVisible()) {
                this.showPopup();
            }
        });

        this.input.onKeyDown((event: KeyboardEvent) => {
            if (KeyHelper.isEnterKey(event)) {
                this.hidePopup();
                FormEl.moveFocusToNextFocusable(this.input);
                event.stopPropagation();
                event.preventDefault();
            } else if (KeyHelper.isEscKey(event) || KeyHelper.isArrowUpKey(event)) {
                this.hidePopup();
            } else if (KeyHelper.isArrowDownKey(event)) {
                this.showPopup();
                event.stopPropagation();
                event.preventDefault();
            }
        });
    }

    protected createPopup(): T {
        throw new Error('must be implemented by inheritor');
    }

    protected createInput(): TextInput {
        throw new Error('must be implemented by inheritor');
    }

    private appendInput(): void {
        this.input = this.createInput();
        this.setupInputListeners();

        const wrapperEl: DivEl = new DivEl('wrapper', StyleHelper.COMMON_PREFIX);
        wrapperEl.appendChild(this.input);

        this.appendChild(wrapperEl);
    }

    hidePopup(): void {
        this.popup?.hide();
    }

    showPopup(): void {
        this.initPopup();
        this.popup.show();
    }

    protected togglePopupVisibility(): void {
        if (this.popup?.isVisible()) {
            this.hidePopup();
        } else {
            this.showPopup();
        }
    }

    private initPopup(): void {
        if (this.popup) {
            return;
        }

        this.popup = this.createPopup();
        this.popup.insertAfterEl(this.input);
        this.setupPopupListeners();
    }
}
