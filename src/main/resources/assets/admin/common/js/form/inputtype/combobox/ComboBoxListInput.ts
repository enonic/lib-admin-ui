import {ListBoxInput, ListBoxInputOptions} from '../../../ui/selector/list/ListBoxInput';
import {Option} from '../../../ui/selector/Option';
import {ComboBoxOption} from './ComboBoxOption';
import {ComboBoxList} from './ComboBoxList';

export interface ComboBoxListInputOptions extends ListBoxInputOptions<ComboBoxOption> {
    items: ComboBoxOption[];
}

export class ComboBoxListInput extends ListBoxInput<ComboBoxOption> {

    constructor(options: ComboBoxListInputOptions) {
        super(new ComboBoxList(), options);

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
