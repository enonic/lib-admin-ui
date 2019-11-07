import {Element, NewElementBuilder} from './Element';

export class BrEl
    extends Element {

    constructor() {
        super(new NewElementBuilder().setTagName('br'));
    }
}
