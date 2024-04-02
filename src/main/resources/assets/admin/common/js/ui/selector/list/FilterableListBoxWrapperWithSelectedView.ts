import {ListBox} from './ListBox';
import {BaseSelectedOptionsView} from '../combobox/BaseSelectedOptionsView';
import {SelectionChange} from '../../../util/SelectionChange';
import {Option} from '../Option';
import {SelectedOptionEvent} from '../combobox/SelectedOptionEvent';
import {FilterableListBoxOptions, FilterableListBoxWrapper} from './FilterableListBoxWrapper';
import {SelectedOption} from '../combobox/SelectedOption';

export interface ListBoxInputOptions<I> extends FilterableListBoxOptions<I> {
    selectedOptionsView: BaseSelectedOptionsView<I>
}

export abstract class FilterableListBoxWrapperWithSelectedView<I>
    extends FilterableListBoxWrapper<I> {

    protected selectedOptionsView: BaseSelectedOptionsView<I>;

    protected options: ListBoxInputOptions<I>;

    protected constructor(listBox: ListBox<I>, options?: ListBoxInputOptions<I>) {
        super(listBox, options);
    }

    protected initElements() {
        super.initElements();

        this.selectedOptionsView = this.options.selectedOptionsView;
        this.selectedOptionsView.setMaximumOccurrences(this.options.maxSelected);
    }

    protected initListeners(): void {
        super.initListeners();

        this.selectedOptionsView.onOptionDeselected((event: SelectedOptionEvent<I>) => {
            this.deselect(event.getSelectedOption().getOption().getDisplayValue());
        });
    }

    protected doSelect(itemToSelect: I): void {
        super.doSelect(itemToSelect);

        const optionToSelect = this.createSelectedOption(itemToSelect);

        if (!this.selectedOptionsView.isSelected(optionToSelect)) {
            this.selectedOptionsView.addOption(optionToSelect, true, -1);
        }
    }

    protected doDeselect(itemToDeselect: I): void {
        super.doDeselect(itemToDeselect);

        const option = this.createSelectedOption(itemToDeselect);
        const existing = this.selectedOptionsView.getById(option.getId());

        if (existing) {
            this.selectedOptionsView.removeOption(this.createSelectedOption(itemToDeselect), true);
        }
    }

    abstract createSelectedOption(item: I): Option<I>;

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('filterable-listbox-wrapper-with-selected-view');
            this.appendChild(this.selectedOptionsView);

            return rendered;
        });
    }

    countSelected(): number {
        return this.selectedOptionsView.count();
    }

    getSelectedOptions(): SelectedOption<I>[] {
        return this.selectedOptionsView.getSelectedOptions();
    }

    getSelectedOptionsView(): BaseSelectedOptionsView<I> {
        return this.selectedOptionsView;
    }

    setEnabled(enable: boolean): void {
        super.setEnabled(enable);

        this.selectedOptionsView.setReadonly(!enable);
    }
}
