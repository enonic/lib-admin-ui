module api.ui.selector.combobox {

    export class BaseSelectedOptionView<T> extends api.dom.DivEl implements SelectedOptionView<T> {

        private option: api.ui.selector.Option<T>;

        private optionValueEl: api.dom.DivEl;

        private removeClickedListeners: {(): void;}[] = [];

        private editable: boolean;

        private removable: boolean;

        constructor(option: api.ui.selector.Option<T>, editable: boolean = true, removable: boolean = true) {
            super('selected-option');

            this.option = option;
            this.editable = editable;
            this.removable = removable;
        }

        setOption(option: api.ui.selector.Option<T>) {
            if (this.optionValueEl) {
                this.optionValueEl.getEl().setInnerHtml(option.displayValue.toString());
            }
            this.option = option;
        }

        getOption(): api.ui.selector.Option<T> {
            return this.option;
        }

        protected appendActionButtons(container: api.dom.Element = this) {
            if (this.editable) {
                container.appendChild(this.createEditButton());
            }
            if (this.removable) {
                container.appendChild(this.createRemoveButton());
            }
        }

        doRender(): wemQ.Promise<boolean> {

            this.optionValueEl = new api.dom.DivEl('option-value');
            if (this.option) {
                this.setOption(this.option);
            }
            this.appendChild(this.optionValueEl);

            this.appendActionButtons();

            return wemQ(true);
        }

        protected notifyRemoveClicked() {
            this.removeClickedListeners.forEach((listener) => {
                listener();
            });
        }

        onRemoveClicked(listener: {(): void;}) {
            this.removeClickedListeners.push(listener);
        }

        unRemoveClicked(listener: {(): void;}) {
            this.removeClickedListeners = this.removeClickedListeners.filter(function (curr: {(): void;}) {
                return curr !== listener;
            });
        }

        setReadonly(readonly: boolean) {
            this.editable = readonly ? false : this.editable;
            this.removable = readonly ? false : this.removable;
        }

        setEditable(editable: boolean) {
            this.editable = editable;
        }

        setRemovable(removable: boolean) {
            this.removable = removable;
        }

        isEditable(): boolean {
            return this.editable;
        }

        protected onEditButtonClicked(e: MouseEvent): boolean {
            e.stopPropagation();
            e.preventDefault();

            return false;
        }

        protected onRemoveButtonClicked(e: MouseEvent): boolean {
            this.notifyRemoveClicked();

            e.stopPropagation();
            e.preventDefault();
            return false;
        }

        private createEditButton(): api.dom.AEl {
            let editButton = new api.dom.AEl('edit');
            editButton.onClicked((event: MouseEvent) => this.onEditButtonClicked(event));

            return editButton;
        }

        private createRemoveButton(): api.dom.AEl {
            let removeButton = new api.dom.AEl('remove');
            removeButton.onClicked((event: MouseEvent) => this.onRemoveButtonClicked(event));

            return removeButton;
        }
    }
}
