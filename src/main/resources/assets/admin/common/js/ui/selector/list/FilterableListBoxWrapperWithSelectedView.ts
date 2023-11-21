import {ListBox} from './ListBox';
import {BaseSelectedOptionsView} from '../combobox/BaseSelectedOptionsView';
import {SelectionChange} from '../../../util/SelectionChange';
import {Option} from '../Option';
import {SelectedOptionEvent} from '../combobox/SelectedOptionEvent';
import {FilterableListBoxWrapper, FilterableListBoxOptions} from './FilterableListBoxWrapper';
import {SelectableListBoxDropdownOptions} from './SelectableListBoxWrapper';

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

        this.onSelectionChanged((selectionChange: SelectionChange<I>) => {
            selectionChange.selected?.forEach((item: I) => {
                this.selectedOptionsView.addOption(this.createSelectedOption(item), true, -1);
            });

            selectionChange.deselected?.forEach((item: I) => {
                const option = this.createSelectedOption(item);
                const existing = this.selectedOptionsView.getById(option.getId());

                if (existing) {
                    this.selectedOptionsView.removeOption(this.createSelectedOption(item), true);
                }
            });
        });

        this.selectedOptionsView.onOptionDeselected((event: SelectedOptionEvent<I>) => {
            this.deselect(event.getSelectedOption().getOption().getDisplayValue());
        });
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

    maximumOccurrencesReached(): boolean {
        return this.selectedOptionsView.maximumOccurrencesReached();
    }
}
