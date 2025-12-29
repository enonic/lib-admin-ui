import {IframeEventBus} from './IframeEventBus';
import {AbstractEvent} from './AbstractEvent';

export interface ClassConstructor {

    new(...args: any[]): any;

    fromObject?(obj: object): any;
}

export class IframeEvent
    extends AbstractEvent {

    fire() {
        IframeEventBus.get().fireEvent(this);
    }

    toMessage(): string {
        return '';
    }

    static fromMessage(name: string, data: string): IframeEvent {
        return new IframeEvent(name);
    }

    static getEventBus(): IframeEventBus {
        return IframeEventBus.get();
    }
}
