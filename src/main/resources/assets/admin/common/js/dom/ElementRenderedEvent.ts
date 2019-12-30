import {Element} from './Element';
import {ElementEvent} from './ElementEvent';

export class ElementRenderedEvent
    extends ElementEvent {

    constructor(element: Element, target?: Element) {
        super('rendered', element, target);
    }
}
