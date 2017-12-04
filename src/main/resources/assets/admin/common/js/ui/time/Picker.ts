module api.ui.time {

    export class Picker extends api.dom.DivEl {

        protected popup: any;

        protected selectedDate: Date;

        protected input: api.ui.text.TextInput;

        protected validUserInput: boolean;

        private builder: any;

        private selectedDateTimeChangedListeners: {(event: SelectedDateChangedEvent) : void}[] = [];

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

        protected setupPopupListeners(_builder: any) {
            this.popup.onShown(() => this.addClass('expanded'));
            this.popup.onHidden(() => this.removeClass('expanded'));

            // Prevent focus loss on mouse down
            this.popup.onMouseDown((event: MouseEvent) => {
                event.preventDefault();
            });

            this.popup.onKeyDown((event: KeyboardEvent) => {
                if (api.ui.KeyHelper.isTabKey(event)) {
                    if (!(document.activeElement === this.input.getEl().getHTMLElement())) {
                        this.popup.hide();
                    }
                }
            });
        }

        protected setupInputListeners() {
            api.util.AppHelper.focusInOut(this, () => {
                this.hidePopup();
            }, 50, false);

            this.input.onClicked((e: MouseEvent) => {
                e.preventDefault();
                this.togglePopupVisibility();
            });

            this.input.onFocus((e: FocusEvent) =>
                setTimeout(() => {
                    if (!this.popup.isVisible()) {
                        e.preventDefault();
                        this.showPopup();
                    }
                }, 150)
            );

            this.input.onKeyDown((event: KeyboardEvent) => {
                if (api.ui.KeyHelper.isEnterKey(event)) {
                    this.hidePopup();
                    api.dom.FormEl.moveFocusToNextFocusable(this.input);
                    event.stopPropagation();
                    event.preventDefault();
                } else if (api.ui.KeyHelper.isEscKey(event) || api.ui.KeyHelper.isArrowUpKey(event)) {
                    this.hidePopup();
                } else if (api.ui.KeyHelper.isArrowDownKey(event)) {
                    this.showPopup();
                    event.stopPropagation();
                    event.preventDefault();
                }
            });
        }

        public resetBase() {
            this.input.resetBaseValues();
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
            let wrapper = new api.dom.DivEl('wrapper', api.StyleHelper.COMMON_PREFIX);
            wrapper.appendChild(this.input);

            this.appendChild(wrapper);
        }

        private createPopup() {
            if (!!this.popup) {
                return;
            }

            this.initPopup(this.builder);
            this.setupPopupListeners(this.builder);

            this.popup.insertAfterEl(this.input);
        }

        protected hidePopup() {
            if (this.popup) {
                this.popup.hide();
            }
        }

        protected showPopup() {
            this.createPopup();
            this.popup.show();
        }

        protected togglePopupVisibility() {
            if (!this.popup) {
                this.showPopup();
            } else {
                this.popup.setVisible(!this.popup.isVisible());
            }
        }

        getTextInput(): api.ui.text.TextInput {
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
    }
}
