import {Event} from './Event';

interface HandlersMapEntry {
    customEventHandler: (customEvent: any) => void;
    apiEventHandler: (apiEventObj: Event) => void;
}

export class EventBus {

    private static handlersMap: { [eventName: string]: HandlersMapEntry[] } = {};

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

    static fireEvent(apiEventObj: Event, contextWindow: Window = window) {
        const event = new CustomEvent(apiEventObj.getName(), {
            bubbles: true,
            detail: apiEventObj
        });
        contextWindow.dispatchEvent(event);
    }

}
