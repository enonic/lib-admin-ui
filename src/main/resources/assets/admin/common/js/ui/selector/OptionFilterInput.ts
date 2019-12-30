import {i18n} from '../../util/Messages';
import {TextInput} from '../text/TextInput';

export class OptionFilterInput
    extends TextInput {

    private placeholderText: string;

    constructor(placeholderText?: string) {
        super('option-filter-input');
        this.placeholderText = placeholderText ? placeholderText : i18n('field.option.placeholder');

        this.setPlaceholder(this.placeholderText);
    }

    openForTypingAndFocus() {
        this.openForTyping();
        this.getHTMLElement().focus();
    }

    openForTyping() {
        this.setPlaceholder(this.placeholderText);
        this.getEl().setDisabled(false);
    }
}

