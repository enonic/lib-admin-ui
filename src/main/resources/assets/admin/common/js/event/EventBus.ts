import {Event} from './Event';
import {AbstractEventBus, HandlersMapEntry} from './AbstractEventBus';

export class EventBus
    extends AbstractEventBus<Event> {

    private static instance: EventBus;

    static get(receiver?: Window): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus(receiver);
        } else if (receiver && !EventBus.instance.hasReceiver(receiver)) {
            console.warn('EventBus instance already exists with different receiver, use addReceiver(window) to add a new one.');
        }
        return EventBus.instance;
    }

    onEvent(eventName: string, handler: (event: Event) => void): HandlersMapEntry<Event> {
        const entry = super.onEvent(eventName, handler);
        entry.customHandler = (e: CustomEvent) => handler(e.detail);
        this.receivers[0].addEventListener(eventName, entry.customHandler);
        return entry;
    }

    unEvent(eventName: string, handler?: (event: Event) => void) {
        const entries = super.unEvent(eventName, handler);
        entries.forEach((entry: HandlersMapEntry<Event>) => {
            this.receivers[0].removeEventListener(eventName, entry.customHandler);
        });
        return entries;
    }

    public fireEvent(event: Event) {

        const customEvent = new CustomEvent(event.getName(), {
            bubbles: true,
            detail: event
        });

        if (!this.receivers.length) {
            throw new Error(`No receivers set for EventBus, use addReceiver(window) to set one.`);
        }

        this.receivers.forEach((receiver) => receiver.dispatchEvent(customEvent));
    }

}
