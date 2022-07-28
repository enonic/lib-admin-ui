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

    constructor(label?: string, subTitle?: string) {
        super('form-occurrence-draggable-label');

        const dragHandle = new DivEl('drag-control');

        this.title = document.createTextNode(label || '');

        this.subTitle = new PEl('note');
        if (subTitle) {
            this.subTitleText = subTitle;
            this.subTitle.setHtml(subTitle);
            this.refreshCustomClass();
        }

        this.getEl().appendChildren([dragHandle.getHTMLElement(), this.title, this.subTitle.getHTMLElement()]);
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
