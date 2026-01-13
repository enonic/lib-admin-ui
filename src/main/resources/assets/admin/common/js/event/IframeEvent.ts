import {IframeEventBus} from './IframeEventBus';
import {AbstractEvent} from './AbstractEvent';

export interface ClassConstructor {

    new(...args: any[]): any;

    fromObject?(obj: object): any;

    fromString?(str: string): any;
}

export class IframeEvent
    extends AbstractEvent {

    fire() {
        IframeEventBus.get().fireEvent(this);
    }

    static getEventBus(): IframeEventBus {
        return IframeEventBus.get();
    }
}
