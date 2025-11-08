import {EventBus} from './EventBus';
import {AbstractEvent} from './AbstractEvent';

export class Event
    extends AbstractEvent {

    fire(contextWindow?: Window) {
        EventBus.get(contextWindow).fireEvent(this);
    }

    static getEventBus(contextWindow?: Window): EventBus {
        return EventBus.get(contextWindow);
    }
}
