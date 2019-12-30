import {OptionFilterInput} from '../OptionFilterInput';

export class ComboBoxOptionFilterInput
    extends OptionFilterInput {

    constructor(placeholderText?: string) {
        super(placeholderText);
    }

    setMaximumReached() {
        this.setPlaceholder('Maximum reached');
        this.getEl().setDisabled(true);
    }

    getWidth(): number {
        return this.getEl().getWidth();
    }
}

