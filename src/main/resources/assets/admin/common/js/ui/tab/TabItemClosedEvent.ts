import {TabItemEvent} from './TabItemEvent';
import {TabItem} from './TabItem';

export class TabItemClosedEvent
    extends TabItemEvent {

    constructor(tab: TabItem) {
        super(tab);
    }
}
