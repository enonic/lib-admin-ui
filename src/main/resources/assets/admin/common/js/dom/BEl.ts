import {Element, NewElementBuilder} from './Element';

export class BEl
    extends Element {

    constructor(className?: string, prefix?: string) {
        super(new NewElementBuilder().setTagName('b').setClassName(className, prefix));
    }

    static fromText(text: string): BEl {
        const b = new BEl();
        b.setHtml(text);
        return b;
    }
}
