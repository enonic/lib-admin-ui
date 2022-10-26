import * as $ from 'jquery';
import 'jquery-ui/ui/widgets/sortable';
import {DivEl} from '../../../dom/DivEl';
import {Element} from '../../../dom/Element';
import {Option} from '../Option';
import {ArrayHelper} from '../../../util/ArrayHelper';
import {SelectedOptionsView} from './SelectedOptionsView';
import {SelectedOption} from './SelectedOption';
import {SelectedOptionEvent} from './SelectedOptionEvent';
import {BaseSelectedOptionView, BaseSelectedOptionViewBuilder} from './BaseSelectedOptionView';
import {assertNotNull} from '../../../util/Assert';
import {PEl} from '../../../dom/PEl';
import {i18n} from '../../../util/Messages';

export class BaseSelectedOptionsView<T>
    extends DivEl
    implements SelectedOptionsView<T> {

    protected readonly: boolean = false;
    private list: SelectedOption<T>[] = [];
    private draggingIndex: number;
    private maximumOccurrences: number;
    private optionRemovedListeners: { (removed: SelectedOptionEvent<T>): void; }[] = [];
    private optionAddedListeners: { (added: SelectedOptionEvent<T>): void; }[] = [];
    private optionMovedListeners: { (moved: SelectedOption<T>, fromIndex: number): void }[] = [];
    private editable: boolean = true;
    static MAX_TO_APPEND: number = 100;

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
        this.whenRendered(() => this.setSortable(sortable));
    }

    refreshSortable() {
        if (this.hasClass('sortable')) {
            $(this.getHTMLElement()).sortable('refresh');
        }
    }

    setMaximumOccurrences(value: number) {
        this.maximumOccurrences = value;
    }

    getMaximumOccurrences(): number {
        return this.maximumOccurrences;
    }

    createSelectedOption(option: Option<T>): SelectedOption<T> {
        const builder: BaseSelectedOptionViewBuilder<T> = new BaseSelectedOptionViewBuilder<T>()
            .setOption(option)
            .setEditable(this.editable)
            .setRemovable(!this.readonly);

        return new SelectedOption<T>(new BaseSelectedOptionView(builder), this.count());
    }

    /* Will mark all options as selected, but if there are more options than {MAX_TO_APPEND}
    it'll append only {MAX_TO_APPEND} of them to the view in order to improve performance. */
    addOptions(options: Option<T>[], silent: boolean = false, keyCode: number): boolean {
        if (this.maximumOccurrencesReached()) { return false; }

        if (options.length <= BaseSelectedOptionsView.MAX_TO_APPEND) {
            return options.every(option => this.addOption(option, silent, keyCode));
        }

        const selectedOptions: SelectedOption<T>[] = options.map((option, index) => {
            const selectedOption = this.createSelectedOption(option);

            if (index <= BaseSelectedOptionsView.MAX_TO_APPEND) {
                const optionView = selectedOption.getOptionView();
                optionView.onRemoveClicked(() => this.removeOption(option));
                this.appendChild(optionView);
            }

            return selectedOption;
        });

        this.list = selectedOptions;

        this.appendChild(new PEl('warning-truncated-users').setHtml(i18n('warning.optionsview.truncated')));

        return true;
    }

    addOption(option: Option<T>, silent: boolean = false, keyCode: number): boolean {

        if (this.isSelected(option) || this.maximumOccurrencesReached()) {
            return false;
        }

        let selectedOption: SelectedOption<T> = this.createSelectedOption(option);

        let optionView = selectedOption.getOptionView();
        optionView.onRemoveClicked(() => this.removeOption(option));

        this.getSelectedOptions().push(selectedOption);

        this.appendChild(selectedOption.getOptionView());

        if (!silent) {
            this.notifyOptionSelected(new SelectedOptionEvent(selectedOption, keyCode));
        }

        return true;
    }

    updateOption(optionToUpdate: Option<T>, newOption: Option<T>) {
        assertNotNull(optionToUpdate, 'optionToRemove cannot be null');

        let selectedOption = this.getByOption(optionToUpdate);
        assertNotNull(selectedOption, 'Did not find any selected option to update from option: ' + optionToUpdate.getValue());

        selectedOption.getOptionView().setOption(newOption);
    }

    removeOption(optionToRemove: Option<T>, silent: boolean = false) {
        assertNotNull(optionToRemove, 'optionToRemove cannot be null');

        let selectedOption = this.getByOption(optionToRemove);
        assertNotNull(selectedOption, 'Did not find any selected option to remove from option: ' + optionToRemove.getValue());

        selectedOption.getOptionView().remove();

        this.list = this.list.filter((option: SelectedOption<T>) => {
            return option.getOption().getValue() !== selectedOption.getOption().getValue();
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

    getByOption(option: Option<T>): SelectedOption<T> {
        return this.getById(option.getValue());
    }

    getById(id: string): SelectedOption<T> {
        return this.list.filter((selectedOption: SelectedOption<T>) => {
            return selectedOption.getOption().getValue() === id;
        })[0];
    }

    isSelected(option: Option<T>): boolean {
        return this.getByOption(option) != null;
    }

    maximumOccurrencesReached(): boolean {
        if (this.maximumOccurrences === 0) {
            return false;
        }
        return this.count() >= this.maximumOccurrences;
    }

    moveOccurrence(fromIndex: number, toIndex: number) {

        ArrayHelper.moveElement(fromIndex, toIndex, this.list);
        ArrayHelper.moveElement(fromIndex, toIndex, this.getChildren());

        this.list.forEach((selectedOption: SelectedOption<T>, index: number) => selectedOption.setIndex(index));
    }

    makeEmptyOption(id: string): Option<T> {
        return Option.create<T>()
            .setValue(id)
            .setDisplayValue(this.getEmptyDisplayValue(id))
            .setEmpty(true)
            .build();
    }

    protected getEmptyDisplayValue(_id: string): T {
        return null;
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

    onOptionMoved(listener: (moved: SelectedOption<T>, fromIndex: number) => void) {
        this.optionMovedListeners.push(listener);
    }

    unOptionMoved(listener: (moved: SelectedOption<T>, fromIndex: number) => void) {
        this.optionMovedListeners =
            this.optionMovedListeners.filter((current: (option: SelectedOption<T>, fromIndex: number) => void) => {
                return listener !== current;
            });
    }

    protected handleDnDStart(ui: JQueryUI.SortableUIParams): void {
        let draggedElement = Element.fromHtmlElement(ui.item[0]);
        this.draggingIndex = draggedElement.getSiblingIndex();
    }

    protected handleDnDUpdate(ui: JQueryUI.SortableUIParams) {

        if (this.draggingIndex >= 0) {
            let draggedElement = Element.fromHtmlElement(ui.item[0]);
            let draggedToIndex = draggedElement.getSiblingIndex();
            this.handleMovedOccurrence(this.draggingIndex, draggedToIndex);
        }

        this.draggingIndex = -1;
    }

    protected handleDnDStop(): void {
        // must be implemented by children
    }

    protected notifyOptionDeselected(removed: SelectedOption<T>) {
        this.optionRemovedListeners.forEach((listener) => {
            listener(new SelectedOptionEvent(removed));
        });
    }

    protected notifyOptionSelected(added: SelectedOptionEvent<T>) {
        this.optionAddedListeners.forEach((listener: (added: SelectedOptionEvent<T>) => void) => {
            listener(added);
        });
    }

    protected notifyOptionMoved(moved: SelectedOption<T>, fromIndex: number) {
        this.optionMovedListeners.forEach((listener: (option: SelectedOption<T>, fromIndex: number) => void) => {
            listener(moved, fromIndex);
        });
    }

    private setSortable(sortable: boolean) {
        if (sortable) {
            $(this.getHTMLElement()).sortable({
                cursor: 'move',
                tolerance: 'pointer',
                placeholder: 'selected-option placeholder',
                start: (_event: Event, ui: JQueryUI.SortableUIParams) => this.handleDnDStart(ui),
                update: (_event: Event, ui: JQueryUI.SortableUIParams) => this.handleDnDUpdate(ui),
                stop: () => this.handleDnDStop()
            });
        } else {
            $(this.getHtml()).sortable('destroy');
        }
        this.toggleClass('sortable', sortable);
    }

    private handleMovedOccurrence(fromIndex: number, toIndex: number) {

        this.moveOccurrence(fromIndex, toIndex);
        this.notifyOptionMoved(this.list[toIndex], fromIndex);
    }
}
