import {ClassHelper} from '../ClassHelper';
import {AbstractEventBus} from './AbstractEventBus';

export abstract class AbstractEvent {

    private name: string;

    constructor(name?: string) {
        this.name = name || ClassHelper.getFullName(this);
    }

    static bind(name: string, handler: (event: AbstractEvent) => void, contextWindow: Window = window) {
        this.getEventBus(contextWindow).onEvent(name, handler);
    }

    static unbind(name: string, handler?: (event: AbstractEvent) => void, contextWindow: Window = window) {
        this.getEventBus(contextWindow).unEvent(name, handler);
    }

    getName(): string {
        return this.name;
    }

    abstract fire(contextWindow: Window);

    static getEventBus(contextWindow: Window): AbstractEventBus<AbstractEvent> {
        throw new Error('Method not implemented.');
    };
}
