import {ListBox} from './ListBox';
import {Element} from '../../../dom/Element';
import {DivEl} from '../../../dom/DivEl';
import {Checkbox} from '../../Checkbox';
import {ValueChangedEvent} from '../../../ValueChangedEvent';
import {SelectionChange} from '../../../util/SelectionChange';
import {Body} from '../../../dom/Body';
import {KeyBindings} from '../../KeyBindings';
import {KeyBinding} from '../../KeyBinding';
import * as Q from 'q';
import {ExtendedKeyboardEvent} from 'mousetrap';

export interface SelectableListBoxDropdownOptions<I> {
    className?: string;
    maxSelected?: number;
    checkboxPosition?: 'left' | 'right';
}

export class SelectableListBoxWrapper<I>
    extends DivEl {

    protected readonly listBox: ListBox<I>;

    protected options: SelectableListBoxDropdownOptions<I>;

    protected selectedItems = new Map<string, I>();

    protected selectionDelta = new Map<string, boolean>();

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
        this.listenClickOutside();
        this.addKeyboardNavigation();
    }

    private addListBoxListeners(): void {
        this.listBox.onItemsAdded((items: I[]) => {
            items.forEach((item: I) => this.handleItemAdded(item));
        });

        this.listBox.onItemsRemoved((items: I[]) => {
            items.forEach((item: I) => this.handleItemRemoved(item));
        });
    }

    private handleItemAdded(item: I): void {
        const view: Element = this.listBox.getItemView(item);
        const wrapper: Element = new DivEl('item-view-wrapper');
        const id: string = this.listBox.getIdOfItem(item);

        this.itemsWrappers.set(id, wrapper);

        view.replaceWith(wrapper);
        view.addClass('item-view');

        if (this.isMultiSelect()) {
            wrapper.appendChild(this.createCheckbox(item, view));
            wrapper.addClass(this.options.checkboxPosition === 'left' ? 'checkbox-left' : 'checkbox-right');
        } else {
            wrapper.getEl().setTabIndex(0);

            view.onClicked(() => {
                this.toggleMarkedSelected(item);
            });
        }

        wrapper.appendChild(view);
    }

    private handleItemRemoved(item: I): void {
        const id: string = this.listBox.getIdOfItem(item);
        const wrapper: Element = this.itemsWrappers.get(id);
        wrapper?.remove();
        this.itemsWrappers.delete(id);
    }

    private addKeyboardNavigation(): void {
        let isShowListBoxEvent: boolean = false;

        const navigationKeyBindings = [
            new KeyBinding('esc').setGlobal(true).setCallback(this.handleClickOutside.bind(this)),
            new KeyBinding('up').setGlobal(true).setCallback((e: ExtendedKeyboardEvent) => {
                e.stopPropagation();
                this.focusPrevious();
                return false;
            }),
            new KeyBinding('down').setGlobal(true).setCallback(() => {
                if (!isShowListBoxEvent) {
                    this.focusNext();
                }
                return false;
            }),
            new KeyBinding('enter').setGlobal(true).setCallback(() => {
                this.handlerEnterPressed();
                return false;
            }),
        ];

        if (!this.isMultiSelect()) { // when multiple is on then space works for checkboxes automatically
            const spaceKeyBinding: KeyBinding = new KeyBinding('space')
                .setGlobal(true)
                .setCallback(() => {
                    const focusedItem: I = this.getFocusedItem();

                    if (focusedItem) {
                        this.toggleMarkedSelected(focusedItem);
                    }
                    return false;
                });

            navigationKeyBindings.push(spaceKeyBinding);
        }

        this.listBox.onShown(() => {
            this.selectionDelta = new Map();
            isShowListBoxEvent = true;
            KeyBindings.get().shelveBindings();
            KeyBindings.get().bindKeys(navigationKeyBindings);

            setTimeout(() => { // if open by arrow key then wait for event to finish
                isShowListBoxEvent = false;
            }, 1);
        });

        this.listBox.onHidden(() => {
            this.resetSelection();
            this.selectionDelta = new Map();
            KeyBindings.get().unbindKeys(navigationKeyBindings);
            KeyBindings.get().unshelveBindings();
        });
    }

    private resetSelection(): void {
        this.selectionDelta.forEach((value: boolean, id: string) => {
            const itemWrapper: Element = this.itemsWrappers.get(id);

            if (itemWrapper) {
                this.toggleItemWrapperSelected(itemWrapper, !value);
            }
        });

        this.selectionDelta = new Map();
    }

    private toggleItemWrapperSelected(itemWrapper: Element, isSelected: boolean): void {
        itemWrapper?.toggleClass('selected', isSelected);

        if (this.isMultiSelect()) {
            (itemWrapper?.getFirstChild() as Checkbox)?.setChecked(isSelected, true);
        }
    }

    private listenClickOutside(): void {
        const mouseClickListener: (event: MouseEvent) => void = (event: MouseEvent) => {
            for (let element = event.target; element; element = (element as any).parentNode) {
                if (element === this.getHTMLElement()) {
                    return;
                }
            }
            this.handleClickOutside();
        };

        this.listBox.onHidden(() => {
            Body.get().unMouseDown(mouseClickListener);
        });

        this.listBox.onShown(() => {
            Body.get().onMouseDown(mouseClickListener);
        });
    }

    protected handleClickOutside(): void {
        this.listBox.hide();
    }

    private createCheckbox(item: I, view: Element): Checkbox {
        const checkbox: Checkbox = Checkbox.create().build();

        checkbox.onValueChanged((event: ValueChangedEvent) => {
            if (event.getNewValue()?.toLowerCase() === 'true') {
                this.handleItemMarkedSelected(item);
            } else {
                this.handleItemMarkedDeselected(item);
            }
        });

        view.onClicked(() => {
            checkbox.setChecked(!checkbox.isChecked());
        });

        return checkbox;
    }

    protected handleItemMarkedSelected(item: I): void {
        const id: string = this.listBox.getIdOfItem(item);
        this.toggleItemWrapperSelected(this.itemsWrappers.get(id), true);

        if (this.isSelected(item)) {
            this.selectionDelta.delete(id);
        } else {
            this.selectionDelta.set(id, true);
        }
    }

    protected handleItemMarkedDeselected(item: I): void {
        const id: string = this.listBox.getIdOfItem(item);
        this.toggleItemWrapperSelected(this.itemsWrappers.get(id), false);

        if (this.isSelected(item)) {
            this.selectionDelta.set(id, false);
        } else {
            this.selectionDelta.delete(id);
        }
    }

    protected applySelection(): void {
        const selectionChange: SelectionChange<I> = this.getSelectionChange();

        this.selectionDelta = new Map();
        this.listBox.hide();

        Array.from(this.itemsWrappers.values()).forEach((itemWrapper: Element) => itemWrapper.setVisible(true));

        if (selectionChange.selected.length > 0 || selectionChange.deselected.length > 0) {
            this.notifySelectionChanged(selectionChange);
        }
    }

    private getSelectionChange(): SelectionChange<I> {
        const selectionChange: SelectionChange<I> = {selected: [], deselected: []};

        this.selectionDelta.forEach((isSelected: boolean, id: string) => {
            const item: I = this.listBox.getItem(id);

            if (isSelected) {
                selectionChange.selected.push(item);
                this.selectedItems.set(id, item);
            } else {
                selectionChange.deselected.push(item);
                this.selectedItems.delete(id);
            }
        });

        return selectionChange;
    }

    private isSelected(item: I): boolean {
        const id: string = this.listBox.getIdOfItem(item);
        return this.selectedItems.has(id);
    }

    private focusNext(): void {
        const focusedItemIndex: number = this.getFocusedItemIndex();
        const arrayAfterFocusedItem: Element[] = focusedItemIndex > -1 ? this.listBox.getChildren().slice(focusedItemIndex + 1) : [];
        const arrayToLookForItemToFocus: Element[] = arrayAfterFocusedItem.concat(this.listBox.getChildren());
        this.focusFirstAvailableItem(arrayToLookForItemToFocus);
    }

    private focusFirstAvailableItem(items: Element[]): void {
        items.filter((el: Element) => el.isVisible()).some((itemWrapper: Element) => {
            return this.isMultiSelect() ? itemWrapper.getFirstChild().giveFocus() : itemWrapper.giveFocus();
        });
    }

    private focusPrevious(): void {
        const focusedItemIndex: number = this.getFocusedItemIndex();
        const arrayBeforeFocusedItem: Element[] = focusedItemIndex > -1 ? this.listBox.getChildren().slice(0, focusedItemIndex) : [];
        const arrayToLookForItemToFocus: Element[] =
            arrayBeforeFocusedItem.reverse().concat(this.listBox.getChildren().slice().reverse());
        this.focusFirstAvailableItem(arrayToLookForItemToFocus);
    }

    private getFocusedItemIndex(): number {
        let focusedItemIndex: number = -1;

        this.listBox.getChildren().find((itemWrapper: Element, index: number) => {
            focusedItemIndex = index;
            const elemToCheck: HTMLElement = this.isMultiSelect() ? itemWrapper.getFirstChild()?.getFirstChild()?.getHTMLElement() :
                                             itemWrapper.getHTMLElement();
            return elemToCheck === document.activeElement;
        });

        return focusedItemIndex;
    }

    private getFocusedItem(): I {
        let focusedItem: I = null;

        this.itemsWrappers.forEach((itemWrapper: Element, key: string) => {
            const elemToCheck: HTMLElement =
                this.isMultiSelect() ? itemWrapper.getFirstChild()?.getFirstChild()?.getHTMLElement() : itemWrapper.getHTMLElement();

            if (elemToCheck === document.activeElement) {
                focusedItem = this.listBox.getItem(key);
            }
        });

        return focusedItem;
    }

    private toggleMarkedSelected(item: I): void { // only when in single selection mode
        const id: string = this.listBox.getIdOfItem(item);

        if ((this.isSelected(item) && !this.selectionDelta.has(id)) || this.selectionDelta.get(id)) {
            this.handleItemMarkedDeselected(item);
        } else {
            if (this.selectionDelta.size > 0) {
                this.resetSelection();
            }

            if (this.selectedItems.size > 0) { // unselecting previous selection
                const selectedId: string = this.selectedItems.keys().next().value;
                this.toggleItemWrapperSelected(this.itemsWrappers.get(selectedId), false);
                this.selectionDelta.set(selectedId, false);
            }

            this.handleItemMarkedSelected(item);
        }
    }

    protected handlerEnterPressed(): void {
        const focusedItem: I = this.getFocusedItem();

        if (focusedItem) {
            if (this.selectionDelta.size === 0) {
                if (this.isSelected(focusedItem)) {
                    this.handleItemMarkedDeselected(focusedItem);
                } else {
                    this.handleItemMarkedSelected(focusedItem);
                }
            }

            this.applySelection();
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.listBox.addClass('selectable-listbox');

            return rendered;
        });
    }

    select(item: I, silent?: boolean): void {
        this.toggleSelection(item, true, silent);
    }

    deselect(item: I, silent?: boolean): void {
        this.toggleSelection(item, false, silent);
    }

    toggleSelection(item: I, selected: boolean, silent?: boolean): void {
        const id: string = this.listBox.getIdOfItem(item);

        if (!id) {
            return;
        }

        if (selected) {
            this.selectedItems.set(id, item);
            this.handleItemMarkedSelected(item);

            if (!silent) {
                this.notifySelectionChanged({selected: [item]});
            }
        } else {
            this.selectedItems.delete(id);
            this.handleItemMarkedDeselected(item);

            if (!silent) {
                this.notifySelectionChanged({deselected: [item]});
            }
        }
    }

    countSelected(): number {
        return this.selectedItems.size;
    }

    onSelectionChanged(listener: (selectionChange: SelectionChange<I>) => void): void {
        this.selectionChangedListeners.push(listener);
    }

    unSelectionChanged(listener: (selectionChange: SelectionChange<I>) => void): void {
        this.selectionChangedListeners = this.selectionChangedListeners
            .filter((currentListener: (selectionChange: SelectionChange<I>) => void) => currentListener !== listener);
    }

    private notifySelectionChanged(selectionChange: SelectionChange<I>): void {
        this.selectionChangedListeners.forEach((listener: (selectionChange: SelectionChange<I>) => void) => listener(selectionChange));
    }

    private isMultiSelect(): boolean {
        return this.options.maxSelected === 0 || this.options.maxSelected > 1;
    }
}
