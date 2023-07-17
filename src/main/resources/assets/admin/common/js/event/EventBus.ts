import {Event} from './Event';

interface HandlersMapEntry {
    customEventHandler: (customEvent: any) => void;
    apiEventHandler: (apiEventObj: Event) => void;
}

export class EventBus {

    private static handlersMap: Record<string, HandlersMapEntry[]> = {};

    static onEvent(eventName: string, handler: (apiEventObj: Event) => void, contextWindow: Window = window) {
        let customEventHandler = (customEvent: any) => handler(customEvent.detail);
        if (!EventBus.handlersMap[eventName]) {
            EventBus.handlersMap[eventName] = [];
        }
        EventBus.handlersMap[eventName].push({
            customEventHandler: customEventHandler,
            apiEventHandler: handler
        });
        contextWindow.addEventListener(eventName, customEventHandler);
    }

    static unEvent(eventName: string, handler?: (event: Event) => void, contextWindow: Window = window) {
        if (handler) {
            let customEventHandler: (customEvent: any) => void;
            EventBus.handlersMap[eventName] = (EventBus.handlersMap[eventName] || []).filter((entry: HandlersMapEntry) => {
                if (entry.apiEventHandler === handler) {
                    customEventHandler = entry.customEventHandler;
                }
                return entry.apiEventHandler !== handler;
            });
            contextWindow.removeEventListener(eventName, customEventHandler);
        } else {
            (EventBus.handlersMap[eventName] || []).forEach((entry: HandlersMapEntry) => {
                contextWindow.removeEventListener(eventName, entry.customEventHandler);
            });
            EventBus.handlersMap[eventName] = [];
        }
    }

    static createEvent(eventName: string, params?: any): CustomEvent {
        return new CustomEvent(eventName, params);
    }

    static polyfillCustomEvent(contextWindow: Window) {
        const customEventFn = (event: string, params: any) => {
            params = params || {bubbles: false, cancelable: false, detail: undefined};
            const evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        };

        customEventFn.prototype = window['Event'].prototype;

        contextWindow['CustomEvent'] = customEventFn;
    }

    static fireEvent(apiEventObj: Event, contextWindow: Window = window) {

        if (typeof contextWindow['CustomEvent'] !== 'function') {
            EventBus.polyfillCustomEvent(contextWindow);
        }

        const event = EventBus.createEvent(apiEventObj.getName(), {
            bubbles: true,
            detail: apiEventObj
        });
        contextWindow.dispatchEvent(event);
    }

}
