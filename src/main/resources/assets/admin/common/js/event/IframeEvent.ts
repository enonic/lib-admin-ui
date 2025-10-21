import {IframeEventBus} from './IframeEventBus';
import {AbstractEvent} from './AbstractEvent';

export class IframeEvent
    extends AbstractEvent {

    fire(contextWindow: Window = window) {
        IframeEventBus.get(contextWindow).fireEvent(this);
    }

    static getEventBus(contextWindow: Window): IframeEventBus {
        return IframeEventBus.get(contextWindow);
    }
}
