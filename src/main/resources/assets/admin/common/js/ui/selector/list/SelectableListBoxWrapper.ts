import {ListBox} from './ListBox';
import {Element} from '../../../dom/Element';
import {DivEl} from '../../../dom/DivEl';
import {Checkbox} from '../../Checkbox';
import {SelectionChange} from '../../../util/SelectionChange';
import * as Q from 'q';
import {LiEl} from '../../../dom/LiEl';
import {TreeListBox} from './TreeListBox';

export interface SelectableListBoxDropdownOptions<I> {
    className?: string;
    maxSelected?: number;
    checkboxPosition?: 'left' | 'right';
}

export class SelectableListBoxWrapper<I>
    extends DivEl {

    protected readonly listBox: ListBox<I>;

    protected readonly options: SelectableListBoxDropdownOptions<I>;

    protected selectedItems = new Map<string, I>();

    protected itemsWrappers = new Map<string, Element>();

    protected selectionChangedListeners: ((selectionChange: SelectionChange<I>) => void)[];

    constructor(listBox: ListBox<I>, options?: SelectableListBoxDropdownOptions<I>) {
        super('selectable-listbox-wrapper ' + (options.className || ''));

        this.listBox = listBox;
        this.options = options || {};
        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.selectionChangedListeners = [];
        this.listBox.hide();
    }

    protected initListeners(): void {
        this.addListBoxListeners();
    }

    protected addListBoxListeners(): void {
        this.listBox.onItemsAdded((items: I[]) => {
            items.forEach((item: I) => this.handleItemAdded(item));
        });

        this.listBox.onItemsRemoved((items: I[]) => {
            items.forEach((item: I) => this.handleItemRemoved(item));
        });
    }

    protected handleItemAdded(item: I): void {
        const view: Element = this.listBox instanceof TreeListBox ? this.listBox.getDataView(item) : this.listBox.getItemView(item);
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

        view.onClicked((event: MouseEvent) => {
            if (this.isIntractableViewElement(event.target as HTMLElement)) {
                this.handleUserToggleAction(item);
            }
        });

        wrapper.appendChild(view);
    }

    protected handleUserToggleAction(item: I): void {
        if (!this.isMultiSelect()) { // unselect all other items
            this.getCurrentlySelectedItems().filter((selectedItem) => selectedItem !== item).forEach((selectedItem: I) => {
                this.handleUserDeselected(selectedItem);
            });
        }

        if (this.isItemSelected(item)) {
            this.handleUserDeselected(item);
        } else {
            this.handleUserSelected(item);
        }
    }

    protected getCurrentlySelectedItems(): I[] {
        return Array.from(this.selectedItems.values());
    }

    protected handleUserDeselected(item: I): void {
        this.deselect(item);
    }

    protected handleUserSelected(item: I): void {
        this.select(item);
    }

    protected handleItemRemoved(item: I): void {
        const id: string = this.listBox.getIdOfItem(item);
        const wrapper: Element = this.itemsWrappers.get(id);
        wrapper?.remove();
        this.itemsWrappers.delete(id);
    }

    protected toggleItemWrapperSelected(itemId: string, isSelected: boolean): void {
        const itemWrapper = this.itemsWrappers.get(itemId);
        itemWrapper?.toggleClass('selected', isSelected);

        if (this.isMultiSelect()) {
            (itemWrapper?.getFirstChild() as Checkbox)?.setChecked(isSelected, true);
        }
    }

    private createCheckbox(item: I): Checkbox {
        const checkbox: Checkbox = Checkbox.create().build();

        checkbox.onValueChanged(() => {
            this.handleUserToggleAction(item);
        });

        return checkbox;
    }

    protected isItemSelected(item: I): boolean {
        const id: string = this.listBox.getIdOfItem(item);
        return this.isSelected(id);
    }

    protected isSelected(id: string): boolean {
        return this.selectedItems.has(id);
    }

    protected isIntractableViewElement(element: HTMLElement): boolean {
        return !element?.classList.contains('toggle');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.listBox.addClass('selectable-listbox');

            return rendered;
        });
    }

    select(item: I, silent?: boolean): void {
        const id: string = this.listBox.getIdOfItem(item);

        if (!id) {
            return;
        }

        this.selectedItems.set(id, item);
        this.toggleItemWrapperSelected(id, true);

        if (!silent) {
            this.notifySelectionChanged({selected: [item]});
        }
    }

    deselect(item: I, silent?: boolean): void {
        const id: string = this.listBox.getIdOfItem(item);

        if (!id) {
            return;
        }

        this.selectedItems.delete(id);
        this.toggleItemWrapperSelected(id, false);

        if (!silent) {
            this.notifySelectionChanged({deselected: [item]});
        }
    }

    toggleSelection(item: I, selected: boolean, silent?: boolean): void {
        if (selected) {
            this.select(item, silent);
        } else {
            this.deselect(item, silent);
        }
    }

    updateItem(item: I): void {
        this.listBox.replaceItem(item);
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

    protected isMultiSelect(): boolean {
        return this.options.maxSelected === 0 || this.options.maxSelected > 1;
    }
}
