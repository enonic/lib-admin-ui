import {Event} from '../../../event/Event';
import {ClassHelper} from '../../../ClassHelper';

export class BrowseFilterSearchEvent<DATA>
    extends Event {
    private data: DATA;

    constructor(data: DATA) {
        super();
        this.data = data;
    }

    static on(handler: (event: BrowseFilterSearchEvent<any>) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: BrowseFilterSearchEvent<any>) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

    getData(): DATA {
        return this.data;
    }
}
