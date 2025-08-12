import $ from 'jquery';
import {GLOBAL, GlobalLibAdmin, Store} from '../store/Store';
import {Element} from './Element';

export const WINDOW_KEY: string = 'WindowDOM';

export class WindowDOM {

    private el: any; // Window clashes with Window

    private onBeforeUnloadListeners: ((event: UIEvent) => void)[] = [];

    private onUnloadListeners: ((event: UIEvent) => void)[] = [];

    constructor(element: Window = window) {
        this.el = element;

        const handle = function (event: UIEvent, listeners: ((event: UIEvent) => void)[]) {
            listeners.forEach(l => l(event));
        };

        this.el.onbeforeunload = (event) => {
            handle(event, this.onBeforeUnloadListeners);
        };
        this.el.onunload = (event) => {
            handle(event, this.onUnloadListeners);
        };

        Store.instance().set(WINDOW_KEY, this);
    }

    static get(): WindowDOM {
        let instance: WindowDOM = Store.instance().get(WINDOW_KEY);

        if (instance == null) {
            instance = new WindowDOM();
        }

        return instance;
    }

    asWindow(): Window {
        return this.el;
    }

    getTopParent(): WindowDOM {

        let parent = this.getParent();
        if (!parent) {
            return null;
        }

        let i = 0;
        do {
            let next = parent.getParent();
            if (!next) {
                return parent;
            }
            parent = next;
            i++;
        }
        while (i < 10);
        return null;
    }

    getParent(): WindowDOM {
        let parent = this.el.parent;
        if (parent === this.el) {
            return null;
        }
        const libAdmin: GlobalLibAdmin = parent[GLOBAL];
        let dom;
        if (libAdmin.store) {
            dom = libAdmin.store.get(WINDOW_KEY);
        }
        return dom || new WindowDOM(parent);
    }

    isInIFrame(): boolean {
        return this.el.self !== this.el.top;
    }

    getFrameElement(): HTMLElement {
        return this.el.frameElement;
    }

    getHTMLElement(): HTMLElement {
        return this.el;
    }

    getScrollTop(): number {
        return $(this.el).scrollTop();
    }

    onResized(listener: (event: UIEvent) => void, element?: Element) {
        this.el.addEventListener('resize', listener);

        if (element) {
            element.onRemoved(() => this.unResized(listener));
        }
    }

    unResized(listener: (event: UIEvent) => void) {
        this.el.removeEventListener('resize', listener);
    }

    getWidth(): number {
        return $(this.el).innerWidth();
    }

    getHeight(): number {
        return $(this.el).innerHeight();
    }

    onScroll(listener: (event: UIEvent) => void, element?: Element) {
        this.el.addEventListener('scroll', listener);

        if (element) {
            element.onRemoved(() => this.unScroll(listener));
        }
    }

    unScroll(listener: (event: UIEvent) => void) {
        this.el.removeEventListener('scroll', listener);
    }

    onBeforeUnload(listener: (event: UIEvent) => void) {
        this.onBeforeUnloadListeners.push(listener);
    }

    unBeforeUnload(listener: (event: UIEvent) => void) {
        this.onBeforeUnloadListeners = this.onBeforeUnloadListeners.filter(curr => curr !== listener);
        return this;
    }

    onUnload(listener: (event: UIEvent) => void) {
        this.onUnloadListeners.push(listener);
    }

    unUnload(listener: (event: UIEvent) => void) {
        this.onUnloadListeners = this.onUnloadListeners.filter(curr => curr !== listener);
        return this;
    }

    onFocus(listener: (event: UIEvent) => void) {
        this.el.addEventListener('focus', listener);
    }

    unFocus(listener: (event: UIEvent) => void) {
        this.el.removeEventListener('focus', listener);
    }

    onBlur(listener: (event: UIEvent) => void) {
        this.el.addEventListener('blur', listener);
    }

    unBlur(listener: (event: UIEvent) => void) {
        this.el.removeEventListener('blur', listener);
    }
}
