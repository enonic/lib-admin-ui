import {Element} from '../../dom/Element';
import {Button} from '../button/Button';
import {i18n} from '../../util/Messages';
import {DivEl} from '../../dom/DivEl';
import {TextInput} from '../text/TextInput';
import {KeyHelper} from '../KeyHelper';
import {AppHelper} from '../../util/AppHelper';
import {FormEl} from '../../dom/FormEl';
import {StyleHelper} from '../../StyleHelper';
import {SelectedDateChangedEvent} from './SelectedDateChangedEvent';

export class Picker<T extends Element>
    extends DivEl {

    protected popup: T;

    protected selectedDate: Date;

    protected input: TextInput;

    protected validUserInput: boolean;

    private defaultValueHandler: Function;

    private builder: any;

    private selectedDateTimeChangedListeners: { (event: SelectedDateChangedEvent): void }[] = [];

    constructor(builder: any, className?: string) {
        super(className);

        this.builder = builder;

        this.validUserInput = true;

        this.handleShownEvent();

        this.initData(builder);

        this.initInput(builder);
        this.setupInputListeners();

        this.wrapChildrenAndAppend();
    }

    public resetBase() {
        this.input.resetBaseValues();
    }

    public setDefaultValueHandler(handler: Function): void {
        this.defaultValueHandler = handler;
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

    updateInputStyling() {
        this.input.updateValidationStatusOnUserInput(this.validUserInput);
    }

    giveFocus(): boolean {
        return this.input.giveFocus();
    }

    setEnabled(enable: boolean) {
        this.input.setEnabled(enable);
    }

    forceSelectedDateTimeChangedEvent() {
        this.notifySelectedDateTimeChanged(new SelectedDateChangedEvent(this.selectedDate));
    }

    onSelectedDateTimeChanged(listener: (event: SelectedDateChangedEvent) => void) {
        this.selectedDateTimeChangedListeners.push(listener);
    }

    unSelectedDateTimeChanged(listener: (event: SelectedDateChangedEvent) => void) {
        this.selectedDateTimeChangedListeners = this.selectedDateTimeChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    notifySelectedDateTimeChanged(event: SelectedDateChangedEvent) {
        this.selectedDateTimeChangedListeners.forEach((listener) => {
            listener(event);
        });
    }

    protected setupPopupListeners(_builder: any) {
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

    protected setupInputListeners() {
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

    protected handleShownEvent() {
        // must be implemented by children
    }

    protected initData(_builder: any) {
        // must be implemented by children
    }

    protected initPopup(_builder: any) {
        throw new Error('must be implemented by inheritor');
    }

    protected initInput(_builder: any) {
        throw new Error('must be implemented by inheritor');
    }

    protected wrapChildrenAndAppend() {
        let wrapper = new DivEl('wrapper', StyleHelper.COMMON_PREFIX);
        wrapper.appendChild(this.input);

        this.appendChild(wrapper);
    }

    protected hidePopup() {
        if (this.popup) {
            this.popup.hide();
        }
    }

    protected showPopup() {
        this.createPopup();
        this.popup.resolveDropdownPosition();
        this.popup.show();
    }

    protected togglePopupVisibility() {
        if (this.popup && this.popup.isVisible()) {
            this.hidePopup();
        } else {
            this.showPopup();
        }
    }

    private initDefaultValueButton(): Button {
        const popupDefaultValueButton = new Button(i18n('action.setDefault'));
        popupDefaultValueButton.addClass('default-button');
        popupDefaultValueButton.onClicked(() => {
            this.defaultValueHandler();
        });
        return popupDefaultValueButton;
    }

    private initCloseButton(): Button {
        const popupCloseButton = new Button(i18n('action.ok'));
        popupCloseButton.addClass('close-button');
        popupCloseButton.onClicked(() => this.hidePopup());

        return popupCloseButton;
    }

    private createPopup() {
        if (this.popup) {
            return;
        }

        this.initPopup(this.builder);
        this.setupPopupListeners(this.builder);

        const popUpItems = new DivEl();

        if (this.defaultValueHandler) {
            // Adds the needed css to align the buttons
            popUpItems.setClass('btn-container');
            popUpItems.appendChild(this.initDefaultValueButton());
        }
        popUpItems.appendChild(this.initCloseButton());

        this.popup.appendChild(popUpItems);

        this.popup.insertAfterEl(this.input);
    }
}
