import {InputEl} from '../../dom/InputEl';
import {StyleHelper} from '../../StyleHelper';
import {StringHelper} from '../../util/StringHelper';

export class TextInput
    extends InputEl {

    static MIDDLE: string = 'middle';
    static LARGE: string = 'large';

    /**
     * Specifies RegExp for characters that will be removed during input.
     */
    private stripCharsRe: RegExp;
    /**
     * Forbidden chars filters out keyCodes for delete, backspace and arrow buttons in Firefox, so we need to
     * allow these to pass the filter (8=backspace, 9=tab, 46=delete, 39=right arrow, 47=left arrow)
     */
    private allowedKeyCodes: number[] = [8, 9, 46, 39, 37];

    private previousValue: string;

    private autoTrim: boolean = false;

    constructor(className?: string, size?: string, originalValue?: string) {
        super('text-input', 'text', StyleHelper.COMMON_PREFIX, originalValue);
        if (className) {
            this.addClass(className);
        }

        if (size) {
            this.addClassEx(size);
        }

        this.previousValue = this.getValue();

        this.onKeyUp((event: KeyboardEvent) => {
            if (event.keyCode === 27) {
                this.setPreviousValue();
                this.getEl().blur();
            }
        });

        this.onKeyPressed((event: KeyboardEvent) => {
            if (!this.stripCharsRe) {
                return null;
            }

            let symbol = String.fromCharCode((<any> event).charCode);
            // prevent input of forbidden symbols
            if (this.containsForbiddenChars(symbol)) {
                if (!this.keyCodeAllowed(event.keyCode)) {
                    event.preventDefault();
                    return false;
                }
            }

            return null;
        });

        const updatePreviousValue = () => {
            this.previousValue = this.autoTrim ? this.updateValue() : this.doGetValue();
        };

        this.onFocus(updatePreviousValue);
        this.onBlur(updatePreviousValue);
    }

    static large(className?: string, originalValue?: string): TextInput {
        return new TextInput(className, TextInput.LARGE, originalValue);
    }

    static middle(className?: string, originalValue?: string): TextInput {
        return new TextInput(className, TextInput.MIDDLE, originalValue);
    }

    updateValue(): string {
        this.doSetValue(this.doGetValue());
        this.refreshValueChanged();
        return this.doGetValue();
    }

    setAutoTrim(autoTrim: boolean) {
        this.autoTrim = autoTrim;
    }

    setForbiddenCharsRe(re: RegExp): TextInput {
        this.stripCharsRe = re;
        return this;
    }

    selectText(from?: number, to?: number) {
        let htmlEl = <HTMLInputElement> this.getHTMLElement();

        if (!from) {
            htmlEl.select();
        } else if (!to) {
            to = this.getValue().length;
        }

        if (htmlEl.hasOwnProperty('createTextRange')) {
            let selRange = htmlEl['createTextRange'];
            selRange.collapse(true);
            selRange.moveStart('character', from);
            selRange.moveEnd('character', to);
            selRange.select();
        } else if (htmlEl.setSelectionRange) {
            htmlEl.setSelectionRange(from, to);
        } else if (htmlEl.selectionStart) {
            htmlEl.selectionStart = from;
            htmlEl.selectionEnd = to;
        }
        htmlEl.focus();
    }

    disableAutocomplete(): TextInput {
        this.getEl().setAttribute('autocomplete', 'off');
        return this;
    }

    moveCaretTo(pos: number) {
        this.selectText(pos, pos);
    }

    updateValidationStatusOnUserInput(isValid: boolean) {
        if (isValid) {
            this.removeClass('invalid');
            this.toggleClass('valid', !StringHelper.isEmpty(this.getValue()));
        } else {
            this.removeClass('valid');
            this.addClass('invalid');
        }
    }

    protected doSetValue(value: string) {
        let newValue = this.removeForbiddenChars(value);
        super.doSetValue(newValue);
    }

    private setPreviousValue() {
        this.setValue(this.previousValue);
    }

    private removeForbiddenChars(rawValue: string = ''): string {
        const value = this.autoTrim ? rawValue.trim() : rawValue;
        return this.stripCharsRe ? value.replace(this.stripCharsRe, '') : value;
    }

    private containsForbiddenChars(value: string): boolean {
        // create new RegExp object in order not to mess RegExp.lastIndex
        let forbidden = new RegExp(<any> this.stripCharsRe);
        return forbidden.test(value);
    }

    private keyCodeAllowed(keyCode: number): boolean {
        for (let i = 0; i < this.allowedKeyCodes.length; i++) {
            if (keyCode === this.allowedKeyCodes[i]) {
                return true;
            }
        }
        return false;
    }

}
