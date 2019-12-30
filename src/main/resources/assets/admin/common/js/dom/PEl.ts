import {Element, NewElementBuilder} from './Element';

export class PEl
    extends Element {

    constructor(className?: string, prefix?: string) {
        super(new NewElementBuilder().setTagName('p').setClassName(className, prefix));
    }

}
