import {Element} from '../../dom/Element';
import {Event} from '../../event/Event';
import {ClassHelper} from '../../ClassHelper';

export class SelectorOnBlurEvent
    extends Event {

    private selector: Element;

    constructor(selector: Element) {
        super();
        this.selector = selector;
    }

    static on(handler: (event: SelectorOnBlurEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: SelectorOnBlurEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

    getSelector(): Element {
        return this.selector;
    }
}
