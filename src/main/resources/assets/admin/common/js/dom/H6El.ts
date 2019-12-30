import {Element, NewElementBuilder} from './Element';

export class H6El
    extends Element {

    constructor(className?: string, prefix?: string) {
        super(new NewElementBuilder().setTagName('h6').setClassName(className, prefix));
    }

}
