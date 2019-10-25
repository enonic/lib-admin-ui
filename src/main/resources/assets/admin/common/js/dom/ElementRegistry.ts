import {Element} from './Element';
import {ClassHelper} from '../ClassHelper';
import {Store} from '../store/Store';

const ELEMENT_REGISTRY_KEY: string = 'elementRegistry';

export type ElementRegistryCounter = Map<string, number>;

export type ElementRegistryElements = Map<string, Element>;

export class ElementRegistry {

    private counters: ElementRegistryCounter;

    private elements: ElementRegistryElements;

    private constructor() {
        this.counters = new Map<string, number>();
        this.elements = new Map<string, Element>();
    }

    static instance(): ElementRegistry {
        let instance: ElementRegistry = Store.instance().get(ELEMENT_REGISTRY_KEY);

        if (instance == null) {
            instance = new ElementRegistry();
            Store.instance().set(ELEMENT_REGISTRY_KEY, instance);
        }

        return instance;
    }

    private static getCounters(): ElementRegistryCounter {
        return ElementRegistry.instance().counters;
    }

    private static getElements(): ElementRegistryElements {
        return ElementRegistry.instance().elements;
    }

    public static registerElement(el: Element): string {
        let fullName;
        let id = el.getId();

        if (!id) {
            id = fullName = ClassHelper.getFullName(el);
        } else {
            fullName = id;
        }
        let count = ElementRegistry.getCounters().get(fullName);
        if (count >= 0) {
            id += `-${++count}`;
        }

        ElementRegistry.getCounters().set(fullName, count || 0);
        ElementRegistry.getElements().set(id, el);

        return id;
    }

    public static reRegisterElement(el: Element) {
        const id = el.getId();
        ElementRegistry.getElements().set(id, el);
    }

    public static unregisterElement(el: Element) {
        if (el) {
            ElementRegistry.getElements().delete(el.getId());
            // don't reduce counter because if we deleted 2nd element while having 5,
            // the counter would had been reduced to 4 resulting in a double 5 elements after another one is created.
        }
    }

    public static getElementById(id: string): Element {
        return ElementRegistry.getElements().get(id);
    }

    public static getElementCountById(id: string): number {
        // Get the counter from the id according to the name notation
        return parseInt(id.slice(id.lastIndexOf('-') + 1), 10) || 0;
    }
}
