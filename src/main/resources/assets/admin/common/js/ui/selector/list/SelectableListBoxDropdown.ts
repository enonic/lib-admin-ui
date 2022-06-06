import {ListBoxDropdown, ListBoxDropdownOptions} from './ListBoxDropdown';
import {ListBox} from './ListBox';
import {Element} from '../../../dom/Element';
import {DivEl} from '../../../dom/DivEl';
import {Checkbox} from '../../Checkbox';
import {ValueChangedEvent} from '../../../ValueChangedEvent';
import {SelectionChange} from '../../../util/SelectionChange';
import {Button} from '../../button/Button';
import {i18n} from '../../../util/Messages';
import {Body} from '../../../dom/Body';
import {KeyBindings} from '../../KeyBindings';
import {KeyBinding} from '../../KeyBinding';
import * as Q from 'q';
import {ExtendedKeyboardEvent} from 'mousetrap';

export interface SelectableListBoxDropdownOptions<I>
    extends ListBoxDropdownOptions<I> {
    multiple?: boolean;
}

export class SelectableListBoxDropdown<I>
    extends ListBoxDropdown<I> {

    options: SelectableListBoxDropdownOptions<I>;

    private selectedItems: Map<string, I> = new Map();

    private selectionDelta: Map<string, boolean> = new Map();

    private itemsWrappers: Map<string, Element> = new Map();

    private applyButton: Button;

    private selectionChangedListeners: { (selectionChange: SelectionChange<I>): void }[] = [];

    constructor(listBox: ListBox<I>, options?: SelectableListBoxDropdownOptions<I>) {
        super(listBox, options);
    }

    protected initElements(): void {
        super.initElements();

        this.applyButton = new Button(i18n('action.ok'));
        this.applyButton.hide();
    }

    protected initListeners(): void {
        super.initListeners();

        this.addListBoxListeners();
        this.listenClickOutside();
        this.addKeyboardNavigation();
        this.applyButton.onClicked(() => this.applySelection());
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

        if (this.options.multiple) {
            wrapper.appendChild(this.createCheckbox(item, view));
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

        if (!this.options.multiple) { // when multiple is on then space works for checkboxes automatically
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

        if (this.options.multiple) {
            (<Checkbox>itemWrapper?.getFirstChild()).setChecked(isSelected, true);
        }
    }

    private listenClickOutside(): void {
        const mouseClickListener: (event: MouseEvent) => void = (event: MouseEvent) => {
            for (let element = event.target; element; element = (<any>element).parentNode) {
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

    private handleClickOutside(): void {
        this.listBox.hide();
        this.applyButton.hide();
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

    private handleItemMarkedSelected(item: I): void {
        const id: string = this.listBox.getIdOfItem(item);
        this.toggleItemWrapperSelected(this.itemsWrappers.get(id), true);

        if (this.isSelected(item)) {
            this.selectionDelta.delete(id);
        } else {
            this.selectionDelta.set(id, true);
        }

        this.applyButton.setVisible(this.selectionDelta.size > 0);
    }

    private handleItemMarkedDeselected(item: I): void {
        const id: string = this.listBox.getIdOfItem(item);
        this.toggleItemWrapperSelected(this.itemsWrappers.get(id), false);

        if (this.isSelected(item)) {
            this.selectionDelta.set(id, false);
        } else {
            this.selectionDelta.delete(id);
        }

        this.applyButton.setVisible(this.selectionDelta.size > 0);
    }

    private applySelection(): void {
        const selectionChange: SelectionChange<I> = this.getSelectionChange();

        this.selectionDelta = new Map();
        this.listBox.hide();
        this.applyButton.hide();

        this.optionFilterInput.setValue('', true);
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

    protected filterItem(item: I, searchString: string): void {
        this.itemsWrappers.get(this.listBox.getIdOfItem(item))?.setVisible(this.options.filter(item, searchString));
    }

    private focusNext(): void {
        const focusedItemIndex: number = this.getFocusedItemIndex();
        const arrayAfterFocusedItem: Element[] = focusedItemIndex > -1 ? this.listBox.getChildren().slice(focusedItemIndex + 1) : [];
        const arrayToLookForItemToFocus: Element[] = arrayAfterFocusedItem.concat(this.listBox.getChildren());
        this.focusFirstAvailableItem(arrayToLookForItemToFocus);
    }

    private focusFirstAvailableItem(items: Element[]): void {
        items.filter((el: Element) => el.isVisible()).some((itemWrapper: Element) => {
            return this.options.multiple ? itemWrapper.getFirstChild().giveFocus() : itemWrapper.giveFocus();
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
            const elemToCheck: HTMLElement = this.options.multiple ? itemWrapper.getFirstChild()?.getFirstChild()?.getHTMLElement() :
                                             itemWrapper.getHTMLElement();
            return elemToCheck === document.activeElement;
        });

        return focusedItemIndex;
    }

    private getFocusedItem(): I {
        let focusedItem: I = null;

        this.itemsWrappers.forEach((itemWrapper: Element, key: string) => {
            const elemToCheck: HTMLElement =
                this.options.multiple ? itemWrapper.getFirstChild()?.getFirstChild()?.getHTMLElement() : itemWrapper.getHTMLElement();

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

    private handlerEnterPressed(): void {
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
            this.addClass('selectable-listbox-dropdown');
            this.listBox.addClass('selectable-listbox');
            this.applyButton.addClass('apply-selection-button');
            this.applyButton.insertAfterEl(this.optionFilterInput);

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
}
