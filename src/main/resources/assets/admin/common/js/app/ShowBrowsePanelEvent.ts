import {Event} from '../event/Event';
import {ClassHelper} from '../ClassHelper';

export class ShowBrowsePanelEvent
    extends Event {

    static on(handler: (event: ShowBrowsePanelEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ShowBrowsePanelEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
