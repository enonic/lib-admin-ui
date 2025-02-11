import {Element, NewElementBuilder} from './Element';
import {SpanEl} from './SpanEl';

export class LabelEl
    extends Element {

    private readonly textContainer: Element;

    constructor(value: string, forElement?: Element, className?: string) {
        super(new NewElementBuilder().setTagName('label').setClassName(className));

        this.textContainer = new SpanEl('label-text');
        this.appendChild(this.textContainer);
        this.setValue(value);
        if (forElement) {
            this.setForElement(forElement);
        }
    }

    setForElement(forElement: Element) {
        this.getEl().setAttribute('for', forElement.getId());
    }

    setValue(value: string) {
        this.textContainer.getEl().setInnerHtml(value);
    }

    getValue(): string {
        return this.textContainer.getEl().getInnerHtml();
    }
}
