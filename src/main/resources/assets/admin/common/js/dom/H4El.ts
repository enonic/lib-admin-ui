import {Element, NewElementBuilder} from './Element';

export class H4El
    extends Element {

    constructor(className?: string) {
        super(new NewElementBuilder().setTagName('h4').setClassName(className));
    }

}
