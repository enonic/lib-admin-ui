import {Element, NewElementBuilder} from './Element';

export class H2El
    extends Element {

    constructor(className?: string) {
        super(new NewElementBuilder().setTagName('h2').setClassName(className));
    }

}
