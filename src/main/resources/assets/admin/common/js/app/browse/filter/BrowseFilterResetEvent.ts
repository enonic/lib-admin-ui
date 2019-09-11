import {Event} from '../../../event/Event';
import {ClassHelper} from '../../../ClassHelper';

export class BrowseFilterResetEvent
    extends Event {

    static on(handler: (event: BrowseFilterResetEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: BrowseFilterResetEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
