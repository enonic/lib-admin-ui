import {Element} from './Element';
import {ElementEvent} from './ElementEvent';

export class ElementRemovedEvent
    extends ElementEvent {

    private parent: Element;

    constructor(element: Element, parent: Element, target?: Element) {
        super('removed', element, target);

        this.parent = parent;
    }

    getParent(): Element {
        return this.parent;
    }
}
