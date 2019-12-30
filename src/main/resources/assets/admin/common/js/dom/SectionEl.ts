import {Element, NewElementBuilder} from './Element';

export class SectionEl
    extends Element {

    constructor(className?: string) {
        super(new NewElementBuilder().setTagName('section').setClassName(className));
    }
}
