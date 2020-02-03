import {Element, NewElementBuilder} from './Element';

export class IEl
    extends Element {

    constructor(className?: string) {
        super(new NewElementBuilder().setTagName('i').setClassName(className));
    }

    static fromText(text: string): IEl {
        const i = new IEl();
        i.setHtml(text);
        return i;
    }
}
