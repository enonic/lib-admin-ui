import {ListBoxInput} from '../../../ui/selector/list/ListBoxInput';
import {Option} from '../../../ui/selector/Option';
import {ComboBoxOption} from './ComboBoxOption';
import {BaseSelectedOptionsView} from '../../../ui/selector/combobox/BaseSelectedOptionsView';
import {ComboBoxList} from './ComboBoxList';
import {SelectableListBoxDropdownOptions} from '../../../ui/selector/list/SelectableListBoxDropdown';
import {ComboBoxSelectedOptionsView} from './ComboBoxSelectedOptionsView';

export interface ComboBoxListInputOptions extends SelectableListBoxDropdownOptions<ComboBoxOption> {
    items: ComboBoxOption[];
}

export class ComboBoxListInput extends ListBoxInput<ComboBoxOption> {

    constructor(options: ComboBoxListInputOptions) {
        super(new ComboBoxList(), new ComboBoxSelectedOptionsView(), options);

        this.selectedOptionsView.setEditable(false);
        this.listBox.setItems(options.items);
    }

    createOption(item: ComboBoxOption): Option<ComboBoxOption> {
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
