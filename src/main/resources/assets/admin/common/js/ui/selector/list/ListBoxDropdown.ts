import {ListBox} from './ListBox';
import {OptionFilterInput} from '../OptionFilterInput';
import {DropdownHandle} from '../../button/DropdownHandle';
import {DivEl} from '../../../dom/DivEl';
import {Element} from '../../../dom/Element';
import {ValueChangedEvent} from '../../../ValueChangedEvent';
import {KeyHelper} from '../../KeyHelper';

export interface ListBoxDropdownOptions<I> {
    filter?: (item: I, searchString: string) => boolean;
}

export class ListBoxDropdown<I> extends DivEl {

    protected readonly listBox: ListBox<I>;

    protected options: ListBoxDropdownOptions<I>;

    protected optionFilterInput: OptionFilterInput;

    private dropdownHandle: DropdownHandle;

    constructor(listBox: ListBox<I>, options?: ListBoxDropdownOptions<I>) {
        super('listbox-dropdown');

        this.listBox = listBox;
        this.options = options || {};
        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.optionFilterInput = new OptionFilterInput();
        this.dropdownHandle = new DropdownHandle();
        this.listBox.hide();
    }

    protected initListeners(): void {
        this.dropdownHandle.onClicked(() => {
            this.listBox.setVisible(!this.listBox.isVisible());
        });

        this.listBox.onShown(() => {
            this.dropdownHandle.down();
        });

        this.listBox.onHidden(() => {
            this.dropdownHandle.up();
        });

        this.optionFilterInput.onValueChanged((event: ValueChangedEvent) => {
            this.listBox.setVisible(true);

            if (this.options.filter) {
                this.filterItems(event.getNewValue());
            }
        });

        this.optionFilterInput.onKeyDown((event: KeyboardEvent) => {
            if (!this.listBox.isVisible() && KeyHelper.isArrowDownKey(event)) {
                this.listBox.setVisible(true);
            }
        });
    }

    protected filterItems(searchString: string): void {
        this.listBox.getItems().forEach((item: I) => {
            this.filterItem(item, searchString);
        });
    }

    protected filterItem(item: I, searchString: string): void {
        this.listBox.getItemView(item).setVisible(this.options.filter(item, searchString));
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const filterContainer: DivEl = new DivEl('filter-container');
            filterContainer.appendChildren(this.optionFilterInput, this.dropdownHandle as Element);
            this.appendChildren(filterContainer, this.listBox);

            return rendered;
        });
    }

    setEnabled(enable: boolean): void {
        this.optionFilterInput.setEnabled(enable);
        this.dropdownHandle.setEnabled(enable);
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.optionFilterInput.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.optionFilterInput.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.optionFilterInput.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.optionFilterInput.unBlur(listener);
    }

    giveFocus(): boolean {
        return this.optionFilterInput.giveFocus();
    }
}
