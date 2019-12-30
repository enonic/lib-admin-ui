import {Element, NewElementBuilder} from './Element';

export class ArticleEl
    extends Element {

    constructor(className?: string, contentEditable?: boolean) {
        super(new NewElementBuilder().setTagName('article').setClassName(className));
        this.setContentEditable(contentEditable);
    }

}
