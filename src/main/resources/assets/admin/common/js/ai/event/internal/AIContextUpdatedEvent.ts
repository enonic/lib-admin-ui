import {ClassHelper} from '../../../ClassHelper';
import {Event} from '../../../event/Event';

export class AIContextUpdatedEvent
    extends Event {

    context: string;

    constructor(context: string) {
        super();

        this.context = context;
    }

    static on(handler: (event: AIContextUpdatedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: AIContextUpdatedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
