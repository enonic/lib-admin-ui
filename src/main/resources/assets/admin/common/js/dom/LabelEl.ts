import {StringHelper} from '../util/StringHelper';
import {Element, NewElementBuilder} from './Element';
import {SpanEl} from './SpanEl';

export class LabelEl
    extends Element {

    private textContainer: Element;

    constructor(value: string, forElement?: Element, className?: string) {
        super(new NewElementBuilder().setTagName('label').setClassName(className));

        if (!StringHelper.isBlank(value)) {
            this.setValue(value);
        }

        if (forElement) {
            this.setForElement(forElement);
        }
    }

    private appendTextContainer() {
        if (this.textContainer) {
            return;
        }

        this.textContainer = new SpanEl('label-text');
        this.appendChild(this.textContainer);
    }

    setForElement(forElement: Element) {
        this.getEl().setAttribute('for', forElement.getId());
    }

    setValue(value: string) {
        if (!this.textContainer) {
            this.appendTextContainer();
        }

        this.textContainer.getEl().setInnerHtml(value);
    }

    getValue(): string {
        if (!this.textContainer) {
            return '';
        }

        return this.textContainer.getEl().getInnerHtml();
    }
}
