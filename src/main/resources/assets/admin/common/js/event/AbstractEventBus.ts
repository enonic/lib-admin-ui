import {AbstractEvent} from './AbstractEvent';

export interface HandlersMapEntry<E extends AbstractEvent> {
    handler: (event: E) => void;
    customHandler?: (e: CustomEvent) => void;
}

export abstract class AbstractEventBus<E extends AbstractEvent> {

    protected handlersMap: Record<string, HandlersMapEntry<E>[]> = {};

    protected receivers: Window[] = [];

    public static debug = false;

    protected id: string | number = new Date().getTime();

    protected constructor(contextWindow: Window = window) {
        if (contextWindow) {
            this.addReceiver(contextWindow);
        }
    }

    setId(id: number | string) {
        this.id = id;
        return this;
    }

    addReceiver(receiver: Window) {
        if (!this.hasReceiver(receiver)) {
            if (AbstractEventBus.debug) {
                console.debug(`[${this.id}] Adding receiver window`, receiver);
            }
            this.receivers.push(receiver);
        }
        return this;
    }

    removeReceiver(receiver: Window) {
        if (AbstractEventBus.debug) {
            console.debug(`[${this.id}] Removing receiver window`, receiver);
        }
        this.receivers = this.receivers.filter(r => r !== receiver);
        return this;
    }

    hasReceiver(receiver: Window): boolean {
        return this.receivers.includes(receiver);
    }

    onEvent(eventName: string, handler: (event: E) => void): HandlersMapEntry<E> {
        if (!this.handlersMap[eventName]) {
            this.handlersMap[eventName] = [];
        }
        const entry = {handler};
        this.handlersMap[eventName].push(entry);
        return entry;
    }

    unEvent(eventName: string, handler?: (event: E) => void): HandlersMapEntry<E>[] {
        const removedEntries: HandlersMapEntry<E>[] = [];
        if (handler) {
            this.handlersMap[eventName] = (this.handlersMap[eventName] || []).filter(
                entry => {
                    return entry.handler !== handler ? !!removedEntries.push(entry) : false;
                }
            );
        } else {
            removedEntries.push(...(this.handlersMap[eventName] || []));
            this.handlersMap[eventName] = [];
        }
        return removedEntries;
    }

    public abstract fireEvent(event: E): void;
}
