import {DivEl} from '../dom/DivEl';
import {Element} from '../dom/Element';
import {StringHelper} from '../util/StringHelper';
import {PEl} from '../dom/PEl';

export class FormOccurrenceDraggableLabel
    extends DivEl {

    private readonly title: Text;
    private readonly subTitle: PEl;
    private titleText: string;
    private subTitleText: string;

    constructor(label: string, subTitle?: string) {
        super('form-occurrence-draggable-label');

        let nodes: Node[] = [];

        let dragHandle = new DivEl('drag-control');
        nodes.push(dragHandle.getHTMLElement());

        this.title = document.createTextNode(label);
        nodes.push(this.title);

        this.subTitleText = subTitle;
        this.subTitle = new PEl('note');
        this.subTitle.setHtml(subTitle);
        nodes.push(this.subTitle.getHTMLElement());
        this.refreshCustomClass();

        this.getEl().appendChildren(nodes);
    }

    setText(label: string) {
        this.title.textContent = label.trim();
    }

    setExpandable(expandable: boolean) {
        this.toggleClass('expandable', expandable);
        if (expandable) {
            super.setTitle(this.titleText);
        } else {
            super.setTitle('');
        }
    }

    setTitle(title: string): Element {
        this.titleText = title;
        return super.setTitle(title);
    }

    setSubTitle(subTitle: string) {
        this.subTitleText = subTitle;
        this.subTitle.setHtml(subTitle);
        this.refreshCustomClass();
    }

    getText(): string {
        return this.title.nodeValue;
    }

    private refreshCustomClass() {
        this.toggleClass('custom-label', !StringHelper.isBlank(this.subTitleText));
    }
}
