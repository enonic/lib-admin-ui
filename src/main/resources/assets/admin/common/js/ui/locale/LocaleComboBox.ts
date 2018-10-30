module api.ui.locale {

    import Option = api.ui.selector.Option;
    import Locale = api.locale.Locale;
    import LocaleLoader = api.locale.LocaleLoader;
    import SelectedOption = api.ui.selector.combobox.SelectedOption;

    export class LocaleComboBox extends api.ui.selector.combobox.RichComboBox<Locale> {
        constructor(maxOccurrences?: number, value?: string) {
            let localeSelectedOptionsView = new LocaleSelectedOptionsView();
            localeSelectedOptionsView.onOptionDeselected(() => {
                this.clearSelection();
            });
            let builder = new api.ui.selector.combobox.RichComboBoxBuilder<Locale>().
                setMaximumOccurrences(maxOccurrences || 0).setComboBoxName('localeSelector').setIdentifierMethod('getId').
                setLoader(new LocaleLoader()).
                setValue(value).
                setSelectedOptionsView(localeSelectedOptionsView).
                setOptionDisplayValueViewer(new LocaleViewer()).
                setDelayedInputValueChangedHandling(500);
            super(builder);
        }

        clearSelection(forceClear: boolean = false) {
            this.getLoader().search('');
            super.clearSelection(forceClear);
        }
    }

    class LocaleSelectedOptionView extends LocaleViewer implements api.ui.selector.combobox.SelectedOptionView<Locale> {

        private option: Option<Locale>;

        constructor(option: Option<Locale>) {
            super('selected-option locale-selected-option-view');
            this.setOption(option);
            this.appendRemoveButton();
        }

        setOption(option: api.ui.selector.Option<Locale>) {
            this.option = option;
            this.setObject(option.displayValue);
        }

        getOption(): api.ui.selector.Option<Locale> {
            return this.option;
        }

    }

    class LocaleSelectedOptionsView extends api.ui.selector.combobox.BaseSelectedOptionsView<Locale> {

        constructor() {
            super('locale-selected-options-view');
        }

        createSelectedOption(option: Option<Locale>): SelectedOption<Locale> {
            let optionView = new LocaleSelectedOptionView(option);
            return new api.ui.selector.combobox.SelectedOption<Locale>(optionView, this.count());
        }

    }

}
