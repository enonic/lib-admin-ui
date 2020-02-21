import {BaseRichComboBox, BaseRichComboBoxBuilder} from './BaseRichComboBox';

export class RichComboBox<OPTION_DISPLAY_VALUE>
    extends BaseRichComboBox<OPTION_DISPLAY_VALUE, OPTION_DISPLAY_VALUE> {

    constructor(builder: RichComboBoxBuilder<OPTION_DISPLAY_VALUE>) {
        super(builder);
    }

    protected loadedItemToDisplayValue(value: OPTION_DISPLAY_VALUE): OPTION_DISPLAY_VALUE {
        return value;
    }
}

export class RichComboBoxBuilder<T>
    extends BaseRichComboBoxBuilder<T, T> {

    build(): RichComboBox<T> {
        return new RichComboBox(this);
    }
}
