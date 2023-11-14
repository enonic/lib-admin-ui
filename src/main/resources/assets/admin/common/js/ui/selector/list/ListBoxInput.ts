import {SelectableListBoxDropdown, SelectableListBoxDropdownOptions} from './SelectableListBoxDropdown';
import {ListBox} from './ListBox';
import {BaseSelectedOptionsView} from '../combobox/BaseSelectedOptionsView';
import {SelectionChange} from '../../../util/SelectionChange';
import {Option} from '../Option';
import {SelectedOptionEvent} from '../combobox/SelectedOptionEvent';

export interface ListBoxInputOptions<I> extends SelectableListBoxDropdownOptions<I> {
    selectedOptionsView: BaseSelectedOptionsView<I>
}

export abstract class ListBoxInput<I>
    extends SelectableListBoxDropdown<I> {

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
                this.selectedOptionsView.addOption(this.createOption(item), true, -1);
            });

            selectionChange.deselected?.forEach((item: I) => {
                const option = this.createOption(item);
                const existing = this.selectedOptionsView.getById(option.getId());

                if (existing) {
                    this.selectedOptionsView.removeOption(this.createOption(item), true);
                }
            });
        });

        this.selectedOptionsView.onOptionDeselected((event: SelectedOptionEvent<I>) => {
            this.deselect(event.getSelectedOption().getOption().getDisplayValue());
        });
    }

    abstract createOption(item: I): Option<I>;

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
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
