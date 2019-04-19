module api.ui.selector.combobox {

    export class BaseSelectedOptionsView<T>
        extends api.dom.DivEl
        implements SelectedOptionsView<T> {

        private list: SelectedOption<T>[] = [];

        private draggingIndex: number;

        private maximumOccurrences: number;

        private optionRemovedListeners: { (removed: SelectedOptionEvent<T>): void; }[] = [];

        private optionAddedListeners: { (added: SelectedOptionEvent<T>): void; }[] = [];

        private optionMovedListeners: { (moved: SelectedOption<T>, fromIndex: number): void }[] = [];

        protected readonly: boolean = false;

        private editable: boolean = true;

        constructor(className?: string) {
            super('selected-options' + (className ? ' ' + className : ''));
        }

        setReadonly(readonly: boolean) {
            this.readonly = readonly;
            this.getSelectedOptions().forEach((option: SelectedOption<T>) => {
                option.getOptionView().setReadonly(readonly);
            });
        }

        setEditable(editable: boolean) {
            this.editable = editable;
            this.getSelectedOptions().forEach((option: SelectedOption<T>) => {
                option.getOptionView().setEditable(editable);
            });
        }

        setOccurrencesSortable(sortable: boolean) {
            if (this.isRendered()) {
                this.setSortable(sortable);
            } else {
                this.onRendered(() => this.setSortable(sortable));
            }
        }

        refreshSortable() {
            if (this.hasClass('sortable')) {
                wemjq(this.getHTMLElement()).sortable('refresh');
            }
        }

        private setSortable(sortable: boolean) {
            if (sortable) {
                wemjq(this.getHTMLElement()).sortable({
                    cursor: 'move',
                    tolerance: 'pointer',
                    placeholder: 'selected-option placeholder',
                    start: (_event: Event, ui: JQueryUI.SortableUIParams) => this.handleDnDStart(ui),
                    update: (_event: Event, ui: JQueryUI.SortableUIParams) => this.handleDnDUpdate(ui),
                    stop: () => this.handleDnDStop()
                });
            } else {
                wemjq(this.getHtml()).sortable('destroy');
            }
            this.toggleClass('sortable', sortable);
        }

        protected handleDnDStart(ui: JQueryUI.SortableUIParams): void {
            let draggedElement = api.dom.Element.fromHtmlElement(<HTMLElement>ui.item[0]);
            this.draggingIndex = draggedElement.getSiblingIndex();
        }

        protected handleDnDUpdate(ui: JQueryUI.SortableUIParams) {

            if (this.draggingIndex >= 0) {
                let draggedElement = api.dom.Element.fromHtmlElement(<HTMLElement>ui.item[0]);
                let draggedToIndex = draggedElement.getSiblingIndex();
                this.handleMovedOccurrence(this.draggingIndex, draggedToIndex);
            }

            this.draggingIndex = -1;
        }

        protected handleDnDStop(): void {
            // must be implemented by children
        }

        setMaximumOccurrences(value: number) {
            this.maximumOccurrences = value;
        }

        getMaximumOccurrences(): number {
            return this.maximumOccurrences;
        }

        createSelectedOption(option: api.ui.selector.Option<T>, index?: number): SelectedOption<T> {
            return new SelectedOption<T>(new BaseSelectedOptionView(option, this.editable, !this.readonly),
                index != null ? index : this.count());
        }

        addOption(option: api.ui.selector.Option<T>, silent: boolean = false, keyCode: number, index?: number): boolean {

            if (this.isSelected(option) || this.maximumOccurrencesReached()) {
                return false;
            }

            let selectedOption: SelectedOption<T> = this.createSelectedOption(option, index);

            if(index != null) {
                this.getSelectedOptions().splice(index, 0, selectedOption);
                this.insertChild(selectedOption.getOptionView(), index);

                this.reindexSelectedOptions();

            } else {
                this.getSelectedOptions().push(selectedOption);
                this.appendChild(selectedOption.getOptionView());
            }

            let optionView = selectedOption.getOptionView();
            optionView.onRemoveClicked(() => this.removeOption(option));

            if (!silent) {
                this.notifyOptionSelected(new SelectedOptionEvent(selectedOption, keyCode));
            }

            return true;
        }

        updateOption(optionToUpdate: api.ui.selector.Option<T>, newOption: api.ui.selector.Option<T>) {
            api.util.assertNotNull(optionToUpdate, 'optionToRemove cannot be null');

            let selectedOption = this.getByOption(optionToUpdate);
            api.util.assertNotNull(selectedOption, 'Did not find any selected option to update from option: ' + optionToUpdate.value);

            selectedOption.getOptionView().setOption(newOption);
        }

        removeOption(optionToRemove: api.ui.selector.Option<T>, silent: boolean = false) {
            api.util.assertNotNull(optionToRemove, 'optionToRemove cannot be null');

            let selectedOption = this.getByOption(optionToRemove);
            api.util.assertNotNull(selectedOption, 'Did not find any selected option to remove from option: ' + optionToRemove.value);

            selectedOption.getOptionView().remove();

            this.list = this.list.filter((option: SelectedOption<T>) => {
                return option.getOption().value !== selectedOption.getOption().value;
            });

            // update item indexes to the right of removed item
            if (selectedOption.getIndex() < this.list.length) {
                for (let i: number = selectedOption.getIndex(); i < this.list.length; i++) {
                    this.list[i].setIndex(i);
                }
            }

            if (!silent) {
                this.notifyOptionDeselected(selectedOption);
            }
        }

        count(): number {
            return this.list.length;
        }

        getSelectedOptions(): SelectedOption<T>[] {
            return this.list;
        }

        getByIndex(index: number): SelectedOption<T> {
            return this.list[index];
        }

        getByOption(option: api.ui.selector.Option<T>): SelectedOption<T> {
            return this.getById(option.value);
        }

        getById(id: string): SelectedOption<T> {
            return this.list.filter((selectedOption: SelectedOption<T>) => {
                return selectedOption.getOption().value === id;
            })[0];
        }

        isSelected(option: api.ui.selector.Option<T>): boolean {
            return this.getByOption(option) != null;
        }

        maximumOccurrencesReached(): boolean {
            if (this.maximumOccurrences === 0) {
                return false;
            }
            return this.count() >= this.maximumOccurrences;
        }

        moveOccurrence(fromIndex: number, toIndex: number) {

            api.util.ArrayHelper.moveElement(fromIndex, toIndex, this.list);
            api.util.ArrayHelper.moveElement(fromIndex, toIndex, this.getChildren());

            this.list.forEach((selectedOption: SelectedOption<T>, index: number) => selectedOption.setIndex(index));
        }

        makeEmptyOption(id: string): Option<T> {
            return <Option<T>>{
                value: id,
                displayValue: null,
                empty: true
            };
        }

        private reindexSelectedOptions() {
            this.getSelectedOptions().forEach((curOption: SelectedOption<T>, i: number) => {
                curOption.setIndex(i);
            });
        }

        protected notifyOptionDeselected(removed: SelectedOption<T>) {
            this.optionRemovedListeners.forEach((listener) => {
                listener(new SelectedOptionEvent(removed));
            });
        }

        onOptionDeselected(listener: { (removed: SelectedOptionEvent<T>): void; }) {
            this.optionRemovedListeners.push(listener);
        }

        unOptionDeselected(listener: { (removed: SelectedOptionEvent<T>): void; }) {
            this.optionRemovedListeners = this.optionRemovedListeners.filter(function (curr: { (removed: SelectedOptionEvent<T>): void; }) {
                return curr !== listener;
            });
        }

        onOptionSelected(listener: (added: SelectedOptionEvent<T>) => void) {
            this.optionAddedListeners.push(listener);
        }

        unOptionSelected(listener: (added: SelectedOptionEvent<T>) => void) {
            this.optionAddedListeners = this.optionAddedListeners.filter((current: (added: SelectedOptionEvent<T>) => void) => {
                return listener !== current;
            });
        }

        protected notifyOptionSelected(added: SelectedOptionEvent<T>) {
            this.optionAddedListeners.forEach((listener: (added: SelectedOptionEvent<T>) => void) => {
                listener(added);
            });
        }

        onOptionMoved(listener: (moved: SelectedOption<T>, fromIndex: number) => void) {
            this.optionMovedListeners.push(listener);
        }

        unOptionMoved(listener: (moved: SelectedOption<T>, fromIndex: number) => void) {
            this.optionMovedListeners =
                this.optionMovedListeners.filter((current: (option: SelectedOption<T>, fromIndex: number) => void) => {
                    return listener !== current;
                });
        }

        protected notifyOptionMoved(moved: SelectedOption<T>, fromIndex: number) {
            this.optionMovedListeners.forEach((listener: (option: SelectedOption<T>, fromIndex: number) => void) => {
                listener(moved, fromIndex);
            });
        }

        private handleMovedOccurrence(fromIndex: number, toIndex: number) {

            this.moveOccurrence(fromIndex, toIndex);
            this.notifyOptionMoved(this.list[toIndex], fromIndex);
        }
    }
}
