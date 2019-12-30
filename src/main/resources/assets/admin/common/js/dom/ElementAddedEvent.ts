import {Element} from './Element';
import {ElementEvent} from './ElementEvent';

export class ElementAddedEvent
    extends ElementEvent {

    constructor(element: Element, target?: Element) {
        super('added', element, target);
    }
}
