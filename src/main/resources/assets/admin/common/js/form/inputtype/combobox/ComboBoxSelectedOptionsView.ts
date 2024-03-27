import {BaseSelectedOptionsView} from '../../../ui/selector/combobox/BaseSelectedOptionsView';
import {ComboBoxOption} from './ComboBoxOption';
import {SelectedOption} from '../../../ui/selector/combobox/SelectedOption';
import {Option} from '../../../ui/selector/Option';
import {BaseSelectedOptionView, BaseSelectedOptionViewBuilder} from '../../../ui/selector/combobox/BaseSelectedOptionView';

export class ComboBoxSelectedOptionsView extends BaseSelectedOptionsView<ComboBoxOption> {

    createSelectedOption(option: Option<ComboBoxOption>): SelectedOption<ComboBoxOption> {
        const builder: BaseSelectedOptionViewBuilder<ComboBoxOption> = new BaseSelectedOptionViewBuilder<ComboBoxOption>()
            .setOption(option)
            .setEditable(this.editable)
            .setRemovable(!this.readonly);

        return new SelectedOption<ComboBoxOption>(new ComboBoxSelectedOptionView(builder), this.count());
    }

}

export class ComboBoxSelectedOptionView extends BaseSelectedOptionView<ComboBoxOption> {

    setOption(option: Option<ComboBoxOption>) {
        this.option = option;

        this.optionValueEl.setHtml(option.getDisplayValue().label);
    }

}
