module api.form {

    export class FormOccurrenceDraggableLabel extends api.dom.DivEl {

        private title: Text;

        constructor(label: string, occurrences: Occurrences, note?: string) {
            super('form-occurrence-draggable-label');

            let nodes: Node[] = [];

            let dragHandle = new api.dom.DivEl('drag-control');
            nodes.push(dragHandle.getHTMLElement());

            this.title = document.createTextNode(label);
            nodes.push(this.title);

            if (!!note) {
                let noteEl = new api.dom.Element(new api.dom.NewElementBuilder().setTagName('sup').setGenerateId(true));
                noteEl.addClass('note');
                noteEl.setHtml(note);
                nodes.push(noteEl.getHTMLElement());
            }

            if (occurrences.required()) {
                nodes.push(document.createTextNode(' '));
                let requiredMarker = new api.dom.SpanEl('required');
                nodes.push(requiredMarker.getHTMLElement());
            }
            this.getEl().appendChildren(nodes);
        }

        setTitle(label: string) {
            this.title.nodeValue = label.trim();
        }

        getTitle(): string {
            return this.title.nodeValue;
        }
    }
}
