import {Element, NewElementBuilder} from './Element';

export class AsideEl
    extends Element {

    constructor(className?: string) {
        super(new NewElementBuilder().setTagName('aside').setClassName(className));
    }
}
