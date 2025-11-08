import {Event} from './Event';
import {AbstractEventBus, HandlersMapEntry} from './AbstractEventBus';

export class EventBus
    extends AbstractEventBus<Event> {

    private static instance: EventBus;

    static get(contextWindow: Window = window): EventBus {
        if (!EventBus.instance) {
            console.info(`Creating new EventBus instance by ${window.location.pathname} on ${contextWindow.location.pathname}`);
            EventBus.instance = new EventBus(contextWindow);
        } else if (EventBus.instance.contextWindow !== contextWindow) {
            throw new Error('EventBus instance already created with a different contextWindow');
        }
        return EventBus.instance;
    }

    onEvent(eventName: string, handler: (event: Event) => void): HandlersMapEntry<Event> {
        const entry = super.onEvent(eventName, handler);
        entry.customHandler = (e: CustomEvent) => handler(e.detail);
        this.contextWindow.addEventListener(eventName, entry.customHandler);
        return entry;
    }

    unEvent(eventName: string, handler?: (event: Event) => void) {
        const entries = super.unEvent(eventName, handler);
        entries.forEach((entry: HandlersMapEntry<Event>) => {
            this.contextWindow.removeEventListener(eventName, entry.customHandler);
        });
        return entries;
    }

    public fireEvent(event: Event) {

        const customEvent = new CustomEvent(event.getName(), {
            bubbles: true,
            detail: event
        });

        this.contextWindow.dispatchEvent(customEvent);
    }

}
