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

    private static MAX_LABEL_LENGTH = 255;

    constructor(label?: string, subTitle?: string) {
        super('form-occurrence-draggable-label');

        const dragHandle = new DivEl('drag-control');

        this.title = document.createTextNode(label || '');

        this.subTitle = new PEl('note');
        if (subTitle) {
            this.setSubTitle(subTitle);
        }

        this.getEl().appendChildren([dragHandle.getHTMLElement(), this.title, this.subTitle.getHTMLElement()]);
    }

    setText(value: string) {
        this.title.textContent = this.getPrettifiedText(value);
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

    setSubTitle(value: string) {
        const prettifiedText = this.getPrettifiedText(value);
        this.subTitleText = prettifiedText;
        this.subTitle.setHtml(prettifiedText);
        this.refreshCustomClass();
    }

    getText(): string {
        return this.title.nodeValue;
    }

    private refreshCustomClass() {
        this.toggleClass('custom-label', !StringHelper.isBlank(this.subTitleText));
    }

    private getPrettifiedText(value: string): string {
        return value.trim().substring(0, FormOccurrenceDraggableLabel.MAX_LABEL_LENGTH);
    }
}
