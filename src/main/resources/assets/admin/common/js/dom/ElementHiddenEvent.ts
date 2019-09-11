import {Element} from './Element';
import {ElementEvent} from './ElementEvent';

export class ElementHiddenEvent
    extends ElementEvent {

    constructor(element: Element, target?: Element) {
        super('hidden', element, target);
    }
}
