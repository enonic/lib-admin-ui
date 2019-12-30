import {SelectedOption} from '../ui/selector/combobox/SelectedOption';
import {Option} from '../ui/selector/Option';
import {RichComboBox, RichComboBoxBuilder} from '../ui/selector/combobox/RichComboBox';
import {MacrosLoader} from './resource/MacrosLoader';
import {BaseSelectedOptionsView} from '../ui/selector/combobox/BaseSelectedOptionsView';
import {RichSelectedOptionView, RichSelectedOptionViewBuilder} from '../ui/selector/combobox/RichSelectedOptionView';
import {MacroDescriptor} from './MacroDescriptor';
import {MacroViewer} from './MacroViewer';

export class MacroComboBox
    extends RichComboBox<MacroDescriptor> {

    constructor(builder: MacroComboBoxBuilder) {

        let richComboBoxBuilder = new RichComboBoxBuilder<MacroDescriptor>().setComboBoxName('macroSelector').setLoader(
            builder.loader).setSelectedOptionsView(new MacroSelectedOptionsView()).setMaximumOccurrences(
            builder.maximumOccurrences).setDelayedInputValueChangedHandling(750).setOptionDisplayValueViewer(
            new MacroViewer()).setValue(builder.value).setMaxHeight(250);

        super(richComboBoxBuilder);

        this.addClass('content-combo-box');
    }

    public static create(): MacroComboBoxBuilder {
        return new MacroComboBoxBuilder();
    }

    getLoader(): MacrosLoader {
        return <MacrosLoader> super.getLoader();
    }

    createOption(val: MacroDescriptor): Option<MacroDescriptor> {
        return {
            value: val.getKey().getRefString(),
            displayValue: val
        };
    }
}

export class MacroSelectedOptionsView
    extends BaseSelectedOptionsView<MacroDescriptor> {

    createSelectedOption(option: Option<MacroDescriptor>): SelectedOption<MacroDescriptor> {
        let optionView = new MacroSelectedOptionView(option);
        return new SelectedOption<MacroDescriptor>(optionView, this.count());
    }
}

export class MacroSelectedOptionView
    extends RichSelectedOptionView<MacroDescriptor> {

    constructor(option: Option<MacroDescriptor>) {
        super(new RichSelectedOptionViewBuilder<MacroDescriptor>(option));
    }

    resolveIconUrl(macroDescriptor: MacroDescriptor): string {
        return macroDescriptor.getIconUrl();
    }

    resolveTitle(macroDescriptor: MacroDescriptor): string {
        return macroDescriptor.getDisplayName();
    }

    resolveSubTitle(macroDescriptor: MacroDescriptor): string {
        return macroDescriptor.getDescription();
    }
}

export class MacroComboBoxBuilder {

    maximumOccurrences: number = 0;

    loader: MacrosLoader;

    value: string;

    setMaximumOccurrences(maximumOccurrences: number): MacroComboBoxBuilder {
        this.maximumOccurrences = maximumOccurrences;
        return this;
    }

    setLoader(loader: MacrosLoader): MacroComboBoxBuilder {
        this.loader = loader;
        return this;
    }

    setValue(value: string): MacroComboBoxBuilder {
        this.value = value;
        return this;
    }

    build(): MacroComboBox {
        return new MacroComboBox(this);
    }

}
