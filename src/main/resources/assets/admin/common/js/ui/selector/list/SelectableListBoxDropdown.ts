import {ListBoxDropdown, ListBoxDropdownOptions} from './ListBoxDropdown';
import {ListBox} from './ListBox';
import {Element} from '../../../dom/Element';
import {DivEl} from '../../../dom/DivEl';
import {Checkbox} from '../../Checkbox';
import {ValueChangedEvent} from '../../../ValueChangedEvent';
import {Button} from '../../button/Button';
import {i18n} from '../../../util/Messages';
import {Body} from '../../../dom/Body';

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

    private applyButton?: Button;

    private selectionChangedListeners: { (selected: I[], deselected: I[]): void }[] = [];

    constructor(listBox: ListBox<I>, options?: SelectableListBoxDropdownOptions<I>) {
        super(listBox, options);
    }

    protected initElements() {
        super.initElements();

        if (this.options.multiple) {
            this.applyButton = new Button(i18n('action.ok'));
            this.applyButton.hide();
        }
    }

    protected initListeners() {
        super.initListeners();

        this.addListBoxListeners();
        this.listenClickOutside();
        this.applyButton?.onClicked(() => this.applySelection());
    }

    private addListBoxListeners(): void {
        this.listBox.onItemsAdded((items: I[]) => {
            items.forEach((item: I) => {
                const view: Element = this.listBox.getItemView(item);
                const wrapper: Element = new DivEl('item-view-wrapper');

                this.itemsWrappers.set(this.listBox.getIdOfItem(item), wrapper);

                view.replaceWith(wrapper);
                view.addClass('item-view');

                if (this.options.multiple) {
                    wrapper.appendChild(this.createCheckbox(item, view));
                } else {
                    view.onClicked(() => {
                        if (this.isSelected(item)) {
                            this.handleItemDeselected(item);
                        } else {
                            if (this.selectedItems.size > 0) {
                                Array.from(this.selectedItems.values()).forEach((item: I) => this.handleItemDeselected(item));
                            }

                            this.handleItemSelected(item);
                        }
                    });
                }

                wrapper.appendChild(view);
            });
        });

        this.listBox.onItemsRemoved((items: I[]) => {
            items.forEach((item: I) => {
                const id: string = this.listBox.getIdOfItem(item);
                const wrapper: Element = this.itemsWrappers.get(id);
                wrapper?.remove();
                this.itemsWrappers.delete(id);
            });
        });

        this.listBox.onShown(() => {
            this.selectionDelta = new Map();
        });

        this.listBox.onHidden(() => {
            this.resetSelection();
            this.selectionDelta = new Map();
        });
    }

    private resetSelection(): void {
        this.selectionDelta.forEach((value: boolean, id: string) => {
            const itemWrapper: Element = this.itemsWrappers.get(id);

            if (itemWrapper) {
                this.toggleItemWrapperSelection(itemWrapper, !value);
            }
        });

        this.selectionDelta = new Map();
    }

    private toggleItemWrapperSelection(itemWrapper: Element, isSelected: boolean): void {
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
                this.handleItemSelected(item);
            } else {
                this.handleItemDeselected(item);
            }
        });

        view.onClicked(() => {
            checkbox.setChecked(!checkbox.isChecked());
        });

        return checkbox;
    }

    private handleItemSelected(item: I): void {
        const id: string = this.listBox.getIdOfItem(item);
        this.toggleItemWrapperSelection(this.itemsWrappers.get(id), true);

        if (this.isSelected(item)) {
            this.selectionDelta.delete(id);
        } else {
            this.selectionDelta.set(id, true);
        }

        this.applyButton?.setVisible(this.selectionDelta.size > 0);
    }

    private handleItemDeselected(item: I): void {
        const id: string = this.listBox.getIdOfItem(item);
        this.toggleItemWrapperSelection(this.itemsWrappers.get(id), false);

        if (this.isSelected(item)) {
            this.selectionDelta.set(id, false);
        } else {
            this.selectionDelta.delete(id);
        }

        this.applyButton?.setVisible(this.selectionDelta.size > 0);
    }

    private applySelection(): void {
        const newSelectedItems: I[] = [];
        const deselectedItems: I[] = [];

        this.selectionDelta.forEach((isSelected: boolean, id: string) => {
            const item: I = this.listBox.getItem(id);

            if (isSelected) {
                newSelectedItems.push(item);
                this.selectedItems.set(id, item);
            } else {
                deselectedItems.push(item);
                this.selectedItems.delete(id);
            }
        });

        if (this.options.multiple) {
            this.selectionDelta = new Map();
            this.listBox.hide();
            this.applyButton.hide();
        }

        this.optionFilterInput.setValue('', true);
        Array.from(this.itemsWrappers.values()).forEach((itemWrapper: Element) => itemWrapper.setVisible(true));

        this.notifySelectionChanged(newSelectedItems, deselectedItems);
    }

    private isSelected(item: I): boolean {
        const id: string = this.listBox.getIdOfItem(item);
        return this.selectedItems.has(id);
    }

    protected filterItem(item: I, searchString: string) {
        this.itemsWrappers.get(this.listBox.getIdOfItem(item))?.setVisible(this.options.filter(item, searchString));
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('selectable-listbox-dropdown');
            this.listBox.addClass('selectable-listbox');
            this.applyButton?.addClass('apply-selection-button');
            this.applyButton?.insertAfterEl(this.optionFilterInput);

            return rendered;
        });
    }

    select(item: I, silent?: boolean): void {
        this.toggleSelection(item, true, silent);
    }

    deselect(item: I, silent?: boolean): void {
        this.toggleSelection(item, false, silent);
    }

    toggleSelection(item: I, selected: boolean, silent?: boolean) {
        const id: string = this.listBox.getIdOfItem(item);

        if (!id) {
            return;
        }

        if (selected) {
            this.selectedItems.set(id, item);
            this.handleItemSelected(item);

            if (!silent) {
                this.notifySelectionChanged([item], []);
            }
        } else {
            this.selectedItems.delete(id);
            this.handleItemDeselected(item);

            if (!silent) {
                this.notifySelectionChanged([], [item]);
            }
        }
    }

    onSelectionChanged(listener: (selected: I[], deselected: I[]) => void): void {
        this.selectionChangedListeners.push(listener);
    }

    unSelectionChanged(listener: (selected: I[], deselected: I[]) => void): void {
        this.selectionChangedListeners =
            this.selectionChangedListeners.filter((currentListener: (selected: I[], deselected: I[]) => void) => {
                return currentListener !== listener;
            });
    }

    private notifySelectionChanged(selected: I[], deselected: I[]): void {
        this.selectionChangedListeners.forEach((listener: (selected: I[], deselected: I[]) => void) => {
            listener(selected, deselected);
        });
    }
}
