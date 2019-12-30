import {StringHelper} from '../../util/StringHelper';
import {Element} from '../../dom/Element';
import {DivEl} from '../../dom/DivEl';
import {WindowDOM} from '../../dom/WindowDOM';
import {ResponsiveManager} from '../responsive/ResponsiveManager';
import {TextInput} from './TextInput';

export class AutosizeTextInput
    extends TextInput {

    private attendant: Element;
    private clone: Element;

    constructor(className?: string, size: string = TextInput.MIDDLE, originalValue?: string) {
        super(className, size, originalValue);

        this.addClass('autosize');
        this.setAutocomplete(true);

        // Create <div> element with the same styles as this text input.
        // This clone <div> is displayed as inline element so its width matches to its text length.
        // Then input width will be updated according to text length from the div.
        this.clone = new DivEl().addClass('autosize-clone').addClass(this.getEl().getAttribute('class'));
        // In order to have styles of clone div calculated it has to be in DOM.
        // Attendant element wraps the clone and has zero height
        // so it has calculated styles but isn't shown on a page.
        // Much more the attendant is displayed as block element and will be placed after this input.
        // Therefore it will have the maximum possible length.
        this.attendant = new DivEl().addClass('autosize-attendant');
        this.attendant.appendChild(this.clone);

        // Update input after input has been shown.
        this.onShown(() => this.updateSize());

        // Update input width according to current text length.
        this.onValueChanged(() => this.updateSize());

        // Update input width according to current page size.
        WindowDOM.get().onResized(() => this.updateSize(), this);
        // Update input width according to current panel size.
        ResponsiveManager.onAvailableSizeChanged(this, () => this.updateSize());
    }

    static large(className?: string, originalValue?: string): AutosizeTextInput {
        return new AutosizeTextInput(className, TextInput.LARGE, originalValue);
    }

    static middle(className?: string, originalValue?: string): AutosizeTextInput {
        return new AutosizeTextInput(className, TextInput.MIDDLE, originalValue);
    }

    private updateSize() {
        if (!this.isVisible()) {
            return;
        }

        let inputEl = this.getEl();
        let cloneEl = this.clone.getEl();

        cloneEl.setFontSize(inputEl.getFontSize()).setPaddingLeft(inputEl.getPaddingLeft() + 'px').setPaddingRight(
            inputEl.getPaddingRight() + 'px');

        this.attendant.insertAfterEl(this);

        let cloneHtml = this.getValue();
        if (StringHelper.isEmpty(cloneHtml)) {
            cloneHtml = this.getPlaceholder();
        }
        cloneEl.setInnerHtml(cloneHtml);
        // Set input width to text length from the clone <div>
        // or to maximum possible width corresponding to attendant width.
        if (cloneEl.getWidthWithBorder() > this.attendant.getEl().getWidth()) {
            inputEl.setWidth('100%');
        } else {
            inputEl.setWidthPx(cloneEl.getWidthWithBorder());
        }

        this.attendant.remove();
    }

}
