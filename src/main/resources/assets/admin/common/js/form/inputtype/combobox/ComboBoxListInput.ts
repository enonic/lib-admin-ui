import {FilterableListBoxWrapperWithSelectedView, ListBoxInputOptions} from '../../../ui/selector/list/FilterableListBoxWrapperWithSelectedView';
import {Option} from '../../../ui/selector/Option';
import {ComboBoxOption} from './ComboBoxOption';
import {ComboBoxList} from './ComboBoxList';

export interface ComboBoxListInputOptions extends ListBoxInputOptions<ComboBoxOption> {
    items: ComboBoxOption[];
}

export class ComboBoxListInput extends FilterableListBoxWrapperWithSelectedView<ComboBoxOption> {

    constructor(options: ComboBoxListInputOptions) {
        super(new ComboBoxList(), options);

        this.selectedOptionsView.setEditable(false);
        this.listBox.setItems(options.items);
    }

    createSelectedOption(item: ComboBoxOption): Option<ComboBoxOption> {
        return Option.create<ComboBoxOption>()
            .setValue(item.value)
            .setDisplayValue(item)
            .build();
    }

    selectItems(items: string[], silent?: boolean): void {
        this.listBox.getItems().forEach((item: ComboBoxOption) => {
            if (items.indexOf(item.value) >= 0) {
                this.select(item, silent);
            }
        });
    }

    clear(): void {
        //
    }

}
