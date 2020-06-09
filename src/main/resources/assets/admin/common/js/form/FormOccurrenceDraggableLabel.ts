import {DivEl} from '../dom/DivEl';
import {Element, NewElementBuilder} from '../dom/Element';
import {SpanEl} from '../dom/SpanEl';
import {Occurrences} from './Occurrences';

export class FormOccurrenceDraggableLabel
    extends DivEl {

    private title: Text;

    constructor(label: string, occurrences: Occurrences, note?: string) {
        super('form-occurrence-draggable-label');

        let nodes: Node[] = [];

        let dragHandle = new DivEl('drag-control');
        nodes.push(dragHandle.getHTMLElement());

        this.title = document.createTextNode(label);
        nodes.push(this.title);

        if (!!note) {
            let noteEl = new Element(new NewElementBuilder().setTagName('sup').setGenerateId(true));
            noteEl.addClass('note');
            noteEl.setHtml(note);
            nodes.push(noteEl.getHTMLElement());
        }

        if (occurrences.required()) {
            nodes.push(document.createTextNode(' '));
            let requiredMarker = new SpanEl('required');
            nodes.push(requiredMarker.getHTMLElement());
        }
        this.getEl().appendChildren(nodes);
    }

    setText(label: string) {
        this.title.nodeValue = label.trim();
    }

    getText(): string {
        return this.title.nodeValue;
    }
}
