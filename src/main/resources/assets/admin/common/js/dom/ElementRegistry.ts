import {Element} from './Element';
import {ClassHelper} from '../ClassHelper';

export class ElementRegistry {

    private static counters: { [index: string]: number; } = {};

    private static elements: { [index: string]: Element; } = {};

    public static registerElement(el: Element): string {
        let fullName;
        let id = el.getId();

        if (!id) {
            id = fullName = ClassHelper.getFullName(el);
        } else {
            fullName = id;
        }
        let count = ElementRegistry.counters[fullName];
        if (count >= 0) {
            id += '-' + (++count);
        }

        ElementRegistry.counters[fullName] = count || 0;
        ElementRegistry.elements[id] = el;

        return id;
    }

    public static reRegisterElement(el: Element) {
        const id = el.getId();
        ElementRegistry.elements[id] = el;
    }

    public static unregisterElement(el: Element) {
        if (el) {
            delete ElementRegistry.elements[el.getId()];
            // don't reduce counter because if we deleted 2nd element while having 5,
            // the counter would had been reduced to 4 resulting in a double 5 elements after another one is created.
        }
    }

    public static getElementById(id: string): Element {
        return ElementRegistry.elements[id];
    }

    public static getElementCountById(id: string): number {
        // Get the counter from the id according to the name notation
        let count = parseInt(id.slice(id.lastIndexOf('-') + 1), 10) || 0;
        return count;
    }
}
