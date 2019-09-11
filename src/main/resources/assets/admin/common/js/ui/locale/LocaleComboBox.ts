import {Option} from '../selector/Option';
import {Locale} from '../../locale/Locale';
import {LocaleLoader} from '../../locale/LocaleLoader';
import {SelectedOption} from '../selector/combobox/SelectedOption';
import {RichComboBox, RichComboBoxBuilder} from '../selector/combobox/RichComboBox';
import {SelectedOptionView} from '../selector/combobox/SelectedOptionView';
import {BaseSelectedOptionsView} from '../selector/combobox/BaseSelectedOptionsView';

export class LocaleComboBox
    extends RichComboBox<Locale> {
    constructor(maxOccurrences?: number, value?: string) {
        let localeSelectedOptionsView = new LocaleSelectedOptionsView();
        localeSelectedOptionsView.onOptionDeselected(() => {
            this.clearSelection();
        });
        let builder = new RichComboBoxBuilder<Locale>().setMaximumOccurrences(maxOccurrences || 0).setComboBoxName(
            'localeSelector').setIdentifierMethod('getId').setLoader(new LocaleLoader()).setValue(value).setSelectedOptionsView(
            localeSelectedOptionsView).setOptionDisplayValueViewer(new LocaleViewer()).setDelayedInputValueChangedHandling(500);
        super(builder);
    }

    clearSelection(forceClear: boolean = false) {
        this.getLoader().search('');
        super.clearSelection(forceClear);
    }
}

class LocaleSelectedOptionView
    extends LocaleViewer
    implements SelectedOptionView<Locale> {

    private option: Option<Locale>;

    constructor(option: Option<Locale>) {
        super('selected-option locale-selected-option-view');
        this.setOption(option);
        this.appendRemoveButton();
    }

    setOption(option: Option<Locale>) {
        this.option = option;
        this.setObject(option.displayValue);
    }

    getOption(): Option<Locale> {
        return this.option;
    }

}

class LocaleSelectedOptionsView
    extends BaseSelectedOptionsView<Locale> {

    constructor() {
        super('locale-selected-options-view');
    }

    createSelectedOption(option: Option<Locale>): SelectedOption<Locale> {
        let optionView = new LocaleSelectedOptionView(option);
        return new SelectedOption<Locale>(optionView, this.count());
    }

}

