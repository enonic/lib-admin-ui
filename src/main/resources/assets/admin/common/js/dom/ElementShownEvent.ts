import {Element} from './Element';
import {ElementEvent} from './ElementEvent';

export class ElementShownEvent
    extends ElementEvent {

    constructor(element: Element, target?: Element) {
        super('shown', element, target);
    }
}
