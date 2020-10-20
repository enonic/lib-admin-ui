import {DivEl} from '../dom/DivEl';
import {Element, NewElementBuilder} from '../dom/Element';
import {SpanEl} from '../dom/SpanEl';
import {Occurrences} from './Occurrences';

export class FormOccurrenceDraggableLabel
    extends DivEl {

    private readonly title: Text;
    private readonly note: string;

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
            const noteEl = new Element(new NewElementBuilder().setTagName('p').setGenerateId(true));
            noteEl.addClass('note');
            noteEl.toggleClass('custom-label', this.note !== label)
            noteEl.setHtml(note);
            nodes.push(noteEl.getHTMLElement());
        }

        this.getEl().appendChildren(nodes);
    }

    setText(label: string) {
        this.title.nodeValue = label.trim();
        this.toggleClass('custom-label', this.note !== label)
    }

    getText(): string {
        return this.title.nodeValue;
    }
}
