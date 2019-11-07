import {Event} from '../../../event/Event';
import {ClassHelper} from '../../../ClassHelper';

export class BrowseFilterRefreshEvent
    extends Event {

    static on(handler: (event: BrowseFilterRefreshEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: BrowseFilterRefreshEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
