import {ListBox} from './ListBox';
import {Element} from '../../../dom/Element';
import {DivEl} from '../../../dom/DivEl';
import {Checkbox} from '../../Checkbox';
import {SelectionChange} from '../../../util/SelectionChange';
import * as Q from 'q';
import {LiEl} from '../../../dom/LiEl';
import {TreeListBox, TreeListElement} from './TreeListBox';
import {DataChangedEvent, DataChangedType} from '../../treegrid/DataChangedEvent';

export enum SelectionMode {
    SELECT, // DEFAULT
    HIGHLIGHT,
}


export interface SelectableListBoxDropdownOptions<I> {
    className?: string;
    maxSelected?: number;
    checkboxPosition?: 'left' | 'right';
    highlightMode?: boolean;
}

export class SelectableListBoxWrapper<I>
    extends DivEl {

    public static LIMIT_REACHED_CLASS: string = 'selection-limit-reached';

    protected readonly listBox: ListBox<I>;

    protected readonly options: SelectableListBoxDropdownOptions<I>;

    protected selectedItems = new Map<string, I>();

    protected selectionMode: SelectionMode = SelectionMode.SELECT;

    protected itemsWrappers = new Map<string, Element>();

    protected selectionChangedListeners: ((selectionChange: SelectionChange<I>) => void)[];

    protected selectionLimitReached: boolean = false;

    constructor(listBox: ListBox<I>, options?: SelectableListBoxDropdownOptions<I>) {
        super('selectable-listbox-wrapper ' + (options.className || ''));

        this.listBox = listBox;
        this.options = options || {};
        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.selectionChangedListeners = [];
    }

    protected initListeners(): void {
        this.addListBoxListeners();
    }

    protected addListBoxListeners(): void {
        this.listBox.onItemsAdded((items: I[], itemViews: Element[]) => {
            items.forEach((item: I, index) => this.handleItemAdded(item, itemViews[index]));
        });

        this.listBox.onItemsRemoved((items: I[]) => {
            items.forEach((item: I) => this.handleItemRemoved(item));
        });

        this.listBox.onItemsChanged((items: I[]) => {
            items.forEach((item: I) => this.handleItemUpdated(item));
        });
    }

    protected handleItemAdded(item: I, itemView: Element): void {
        const view: Element = this.listBox instanceof TreeListBox ? (itemView as TreeListElement<I>).getDataView() : itemView;
        const wrapper: Element = new LiEl('item-view-wrapper');
        const id: string = this.listBox.getIdOfItem(item);

        this.itemsWrappers.set(id, wrapper);

        view.replaceWith(wrapper);
        view.addClass('item-view');

        if (this.isMultiSelect()) {
            wrapper.appendChild(this.createCheckbox(item));
            wrapper.addClass(this.options.checkboxPosition === 'left' ? 'checkbox-left' : 'checkbox-right');
        } else {
            wrapper.getEl().setTabIndex(0);
        }

        const clickHandler = (event: MouseEvent) => {
            if (this.isIntractableViewElement(event.target as HTMLElement)) {
                if (this.options.highlightMode) {
                    this.selectionMode = SelectionMode.HIGHLIGHT;
                }

                this.handleUserToggleAction(item);
            }
        };

        wrapper.onClicked((event: MouseEvent) => {
            if (event.detail === 2) { // double click, should be handled differently
                event.stopPropagation();
                event.preventDefault();
                return;
            }

            clickHandler(event);
        });

        wrapper.onContextMenu((event: MouseEvent) => {
            if (!this.isSelected(id)) {
                clickHandler(event); // right click must select item
            }
        });

        if (this.isSelected(id)) {
            this.toggleItemWrapperSelected(id, true);
        }

        wrapper.appendChild(view);
    }

    protected handleUserToggleAction(item: I): void {
        const itemId = this.listBox.getIdOfItem(item);
        const actualItem = this.listBox.getItem(itemId); // making sure we work with actual list item value

        if (!this.isMultiSelect() || this.selectionMode === SelectionMode.HIGHLIGHT) { // unselect all other items
            this.getCurrentlySelectedItems().filter((selectedItem) => this.listBox.getIdOfItem(selectedItem) !== itemId).forEach(
                (selectedItem: I) => {
                    this.handleUserDeselected(selectedItem);
                });
        }

        if (this.isSelected(itemId)) {
            this.handleUserDeselected(actualItem);
        } else {
            this.handleUserSelected(actualItem);
        }
    }

    protected getCurrentlySelectedItems(): I[] {
        return Array.from(this.selectedItems.values());
    }

    getSelectedItems(): I[] {
        return Array.from(this.selectedItems.values());
    }

    getSelectionMode(): SelectionMode {
        return this.selectionMode;
    }

    setSelectionMode(selectionMode: SelectionMode): void {
        this.selectionMode = selectionMode;
    }

    protected handleUserDeselected(item: I): void {
        this.deselect(item);
    }

    protected handleUserSelected(item: I): void {
        this.select(item);
    }

    protected handleItemRemoved(item: I): void {
        const id: string = this.listBox.getIdOfItem(item);
        this.selectedItems.delete(id);
        const wrapper: Element = this.itemsWrappers.get(id);
        wrapper?.remove();
        this.itemsWrappers.delete(id);
    }

    protected toggleItemWrapperSelected(itemId: string, isSelected: boolean): void {
        const itemWrapper = this.itemsWrappers.get(itemId);
        itemWrapper?.toggleClass('selected', isSelected);

        if (this.isMultiSelect()) {
            const isToBeChecked = isSelected && this.selectionMode === SelectionMode.SELECT;
            itemWrapper.toggleClass('checked', isToBeChecked);
            (itemWrapper?.getFirstChild() as Checkbox)?.setChecked(isToBeChecked, true);
        }
    }

    private createCheckbox(item: I): Checkbox {
        const checkbox: Checkbox = Checkbox.create().build();

        checkbox.onClicked((event: MouseEvent) => {
            if (this.selectionMode == SelectionMode.HIGHLIGHT) {
                this.deselectAll(true);
            }

            this.selectionMode = SelectionMode.SELECT;


            event.stopPropagation(); // to not trigger click on wrapper
        });

        checkbox.onValueChanged(() => {
            this.handleUserToggleAction(item);
        });

        return checkbox;
    }

    isItemSelected(item: I): boolean {
        const id: string = this.listBox.getIdOfItem(item);
        return this.isSelected(id);
    }

    isSelected(id: string): boolean {
        return this.selectedItems.has(id);
    }

    protected isIntractableViewElement(element: HTMLElement): boolean {
        return !element?.classList.contains('icon-arrow_drop_up');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.listBox.addClass('selectable-listbox');
            this.appendChild(this.listBox);

            return rendered;
        });
    }

    select(item: I | I[], silent?: boolean): void {
        const items: I[] = Array.isArray(item) ? item : [item];

        items.forEach((itemToSelect: I) => {
            this.doSelect(itemToSelect);
        });

        if (!silent) {
            this.notifySelectionChanged({selected: items});
        }
    }

    protected doSelect(itemToSelect: I): void {
        const id: string = this.listBox.getIdOfItem(itemToSelect);

        if (!id) {
            return;
        }

        this.selectedItems.set(id, itemToSelect);
        this.toggleItemWrapperSelected(id, true);
        this.checkSelectionLimitReached();
    }

    deselect(item: I | I[], silent?: boolean): void {
        const items: I[] = Array.isArray(item) ? item : [item];

        items.forEach((itemToDeselect: I) => {
            this.doDeselect(itemToDeselect);
        });

        if (!silent) {
            this.notifySelectionChanged({deselected: items});
        }
    }

    selectAll(silent?: boolean): void {
        this.select(this.listBox instanceof TreeListBox ? this.listBox.getItems(true) : this.listBox.getItems(), silent);
    }

    protected doDeselect(itemToDeselect: I): void {
        const id: string = this.listBox.getIdOfItem(itemToDeselect);

        if (!id) {
            return;
        }

        this.selectedItems.delete(id);
        this.toggleItemWrapperSelected(id, false);
        this.checkSelectionLimitReached();
    }

    deselectAll(silent?: boolean): void {
        this.deselect(this.getCurrentlySelectedItems(), silent);
    }

    toggleSelection(item: I, selected: boolean, silent?: boolean): void {
        if (selected) {
            this.deselect(item, silent);
        } else {
            this.select(item, silent);
        }
    }

    updateItem(item: I): void {
        this.listBox.replaceItems(item);
    }

    getTotalItems(): number {
        return this.listBox instanceof TreeListBox ? this.listBox.getItems(true).length : this.listBox.getItems().length;
    }

    protected checkSelectionLimitReached(): void {
        const isMaxOccurrencesReached = this.maximumOccurrencesReached();

        if (this.selectionLimitReached && !isMaxOccurrencesReached) {
            this.selectionLimitReached = false;
            this.handleSelectionLimitIsNoLongerReached();
        } else if (!this.selectionLimitReached && isMaxOccurrencesReached) {
            this.selectionLimitReached = true;
            this.handleSelectionLimitReached();
        }
    }

    maximumOccurrencesReached(): boolean {
        return this.options.maxSelected > 0 && this.selectedItems.size >= this.options.maxSelected;
    }

    protected handleSelectionLimitReached(): void {
        this.toggleClass(SelectableListBoxWrapper.LIMIT_REACHED_CLASS, true);
    }

    protected handleSelectionLimitIsNoLongerReached(): void {
        this.toggleClass(SelectableListBoxWrapper.LIMIT_REACHED_CLASS, false);
    }

    onSelectionChanged(listener: (selectionChange: SelectionChange<I>) => void): void {
        this.selectionChangedListeners.push(listener);
    }

    unSelectionChanged(listener: (selectionChange: SelectionChange<I>) => void): void {
        this.selectionChangedListeners = this.selectionChangedListeners
            .filter((currentListener: (selectionChange: SelectionChange<I>) => void) => currentListener !== listener);
    }

    protected notifySelectionChanged(selectionChange: SelectionChange<I>): void {
        this.selectionChangedListeners.forEach((listener: (selectionChange: SelectionChange<I>) => void) => listener(selectionChange));
    }

    isMultiSelect(): boolean {
        return this.options.maxSelected === 0 || this.options.maxSelected > 1;
    }

    onDataChanged(handler: (event: DataChangedEvent<I>) => void): void {
        this.listBox.onItemsAdded((items: I[]): void  => {
            handler(new DataChangedEvent<I>(items, DataChangedType.ADDED));
        });

        this.listBox.onItemsRemoved((items: I[]): void  => {
            handler(new DataChangedEvent<I>(items, DataChangedType.DELETED));
        });

        this.listBox.onItemsChanged((items: I[]): void  => {
            handler(new DataChangedEvent<I>(items, DataChangedType.UPDATED));
        });
    }

    getList(): ListBox<I> {
        return this.listBox;
    }

    protected handleItemUpdated(item: I): void {
        const itemId = this.listBox.getIdOfItem(item);

        if (this.selectedItems.has(itemId)) {
            this.selectedItems.set(itemId, item);
        }
    }
}
