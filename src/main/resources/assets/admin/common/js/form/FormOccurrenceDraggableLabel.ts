import {DivEl} from '../dom/DivEl';
import {Element, NewElementBuilder} from '../dom/Element';
import {SpanEl} from '../dom/SpanEl';
import {Occurrences} from './Occurrences';

export class FormOccurrenceDraggableLabel
    extends DivEl {

    private readonly title: Text;
    private readonly note: string;
    private titleText: string;

    constructor(label: string, occurrences: Occurrences, note?: string) {
        super('form-occurrence-draggable-label');

        let nodes: Node[] = [];

        let dragHandle = new DivEl('drag-control');
        nodes.push(dragHandle.getHTMLElement());

        this.title = document.createTextNode(label);
        nodes.push(this.title);

        if (occurrences.required()) {
            nodes.push(document.createTextNode(' '));
            const requiredMarker = new SpanEl('required');
            nodes.push(requiredMarker.getHTMLElement());
        }

        if (!!note) {
            this.note = note;
            const noteEl = new Element(new NewElementBuilder().setTagName('p').setGenerateId(true).setClassName('note'));
            noteEl.setHtml(note);
            nodes.push(noteEl.getHTMLElement());
            this.toggleClass('custom-label', this.note !== label);
        }

        this.getEl().appendChildren(nodes);
    }

    setText(label: string) {
        this.title.nodeValue = label.trim();
        this.toggleClass('custom-label', this.note !== label);
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

    getText(): string {
        return this.title.nodeValue;
    }
}
