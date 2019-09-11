import {Element, NewElementBuilder} from './Element';

export class DlEl
    extends Element {

    constructor(className?: string) {
        super(new NewElementBuilder().setTagName('dl').setClassName(className));
    }
}
