import {AbstractEvent} from './AbstractEvent';

export interface HandlersMapEntry {
    handler: (event: AbstractEvent) => void;
    customHandler?: (e: CustomEvent) => void;
}

export abstract class AbstractEventBus<E extends AbstractEvent> {
    protected handlersMap: Record<string, HandlersMapEntry[]> = {};
    protected contextWindow: Window;

    protected constructor(contextWindow: Window = window) {
        this.contextWindow = contextWindow;
    }

    onEvent(eventName: string, handler: (event: E) => void): HandlersMapEntry {
        if (!this.handlersMap[eventName]) {
            this.handlersMap[eventName] = [];
        }
        const entry = {handler};
        this.handlersMap[eventName].push(entry);
        return entry;
    }

    unEvent(eventName: string, handler?: (event: E) => void): HandlersMapEntry[] {
        const removedEntries: HandlersMapEntry[] = [];
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
