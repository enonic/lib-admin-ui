import {Element, NewElementBuilder} from './Element';

export class SpanEl
    extends Element {

    constructor(className?: string, prefix?: string) {
        super(new NewElementBuilder().setTagName('span').setClassName(className, prefix));
    }

    static fromText(text: string, className?: string): SpanEl {
        const span = new SpanEl(className);
        span.setHtml(text);
        return span;
    }
}
