module api.content.page.region {

    import RichComboBox = api.ui.selector.combobox.RichComboBox;
    import RichComboBoxBuilder = api.ui.selector.combobox.RichComboBoxBuilder;
    import Option = api.ui.selector.Option;
    import SelectedOption = api.ui.selector.combobox.SelectedOption;
    import BaseSelectedOptionView = api.ui.selector.combobox.BaseSelectedOptionView;
    import BaseSelectedOptionsView = api.ui.selector.combobox.BaseSelectedOptionsView;
    import DescriptorKey = api.content.page.DescriptorKey;

    export class LayoutDescriptorComboBox extends RichComboBox<LayoutDescriptor> {

        constructor() {
            super(new RichComboBoxBuilder<LayoutDescriptor>()
                .setIdentifierMethod('getKey')
                .setOptionDisplayValueViewer(new LayoutDescriptorViewer())
                .setLoader(new LayoutDescriptorLoader())
                .setMaximumOccurrences(1)
                .setNextInputFocusWhenMaxReached(false)
                .setNoOptionsText('No layouts available'));
        }

        loadDescriptors(applicationKeys: ApplicationKey[]) {
            (<LayoutDescriptorLoader>this.getLoader()).setApplicationKeys(applicationKeys);
            this.getLoader().load();
        }

        getDescriptor(descriptorKey: DescriptorKey): LayoutDescriptor {
            let option = this.getOptionByValue(descriptorKey.toString());
            if (option) {
                return option.displayValue;
            }
            return null;
        }

        setDescriptor(descriptor: LayoutDescriptor) {

            this.clearSelection();
            if (descriptor) {
                let optionToSelect: Option<LayoutDescriptor> = this.getOptionByValue(descriptor.getKey().toString());
                if (!optionToSelect) {
                    optionToSelect = {
                        value: descriptor.getKey().toString(),
                        displayValue: descriptor
                    };
                    this.addOption(optionToSelect);
                }
                this.selectOption(optionToSelect);
            }
        }
    }
}
