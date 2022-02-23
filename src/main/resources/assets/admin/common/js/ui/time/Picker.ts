import {Element} from '../../dom/Element';
import {Button} from '../button/Button';
import {i18n} from '../../util/Messages';
import {DivEl} from '../../dom/DivEl';
import {TextInput} from '../text/TextInput';
import {KeyHelper} from '../KeyHelper';
import {AppHelper} from '../../util/AppHelper';
import {FormEl} from '../../dom/FormEl';
import {StyleHelper} from '../../StyleHelper';

export class Picker<T extends Element>
    extends DivEl {

    protected popup: T;

    protected input: TextInput;

    protected validUserInput: boolean;

    protected wrapperEl: DivEl;

    constructor(className?: string) {
        super(className);

        this.validUserInput = true;

        this.appendWrapper();
    }

    public resetBase(): void {
        this.input.resetBaseValues();
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
        this.popup.onMouseDown((event: MouseEvent) => {
            event.preventDefault();
        });

        this.popup.onKeyDown((event: KeyboardEvent) => {
            if (KeyHelper.isTabKey(event)) {
                if (!(document.activeElement === this.input.getEl().getHTMLElement())) {
                    this.popup.hide();
                }
            }
        });
    }

    protected setupInputListeners(): void {
        AppHelper.focusInOut(this, () => {
            this.hidePopup();
        }, 50, false);

        this.input.onClicked((e: MouseEvent) => {
            e.preventDefault();
            this.togglePopupVisibility();
        });

        this.input.onFocus((e: FocusEvent) =>
            setTimeout(() => {
                if (!this.popup || !this.popup.isVisible()) {
                    e.preventDefault();
                    this.showPopup();
                }
            }, 150)
        );

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

    protected initPopup(): void {
        throw new Error('must be implemented by inheritor');
    }

    private appendWrapper(): void {
        this.wrapperEl = new DivEl('wrapper', StyleHelper.COMMON_PREFIX);
        this.appendChild(this.wrapperEl);
    }

    protected hidePopup(): void {
        if (this.popup) {
            this.popup.hide();
        }
    }

    protected showPopup(): void {
        this.createPopup();
        this.popup.resolveDropdownPosition();
        this.popup.show();
    }

    protected togglePopupVisibility(): void {
        if (this.popup && this.popup.isVisible()) {
            this.hidePopup();
        } else {
            this.showPopup();
        }
    }

    private initCloseButton(): void {
        const popupOkButton = new Button(i18n('action.ok'));
        popupOkButton.addClass('ok-button');
        popupOkButton.onClicked(() => this.hidePopup());
        this.popup.appendChild(popupOkButton);
    }

    private createPopup(): void {
        if (this.popup) {
            return;
        }

        this.initPopup();
        this.setupPopupListeners();
        this.initCloseButton();

        this.popup.insertAfterEl(this.input);
    }
}
