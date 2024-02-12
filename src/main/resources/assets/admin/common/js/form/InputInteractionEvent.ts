import {Event} from '../event/Event';
import {ClassHelper} from '../ClassHelper';
import {InputInteractionData} from './InputInteractionData';

export class InputInteractionEvent
    extends Event {

    private readonly data: InputInteractionData;

    constructor(data: InputInteractionData) {
        super();

        this.data = data;
    }

    getData(): InputInteractionData {
        return this.data;
    }

    static on(handler: (event: InputInteractionEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: InputInteractionEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
