import {Element, NewElementBuilder} from './Element';

export class LegendEl
    extends Element {

    constructor(legend: string, className?: string) {
        super(new NewElementBuilder().setTagName('legend').setClassName(className));
        this.getEl().setInnerHtml(legend);
    }
}
