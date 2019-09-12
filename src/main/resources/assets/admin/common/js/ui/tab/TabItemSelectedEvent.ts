import {TabItemEvent} from './TabItemEvent';
import {TabItem} from './TabItem';

export class TabItemSelectedEvent
    extends TabItemEvent {

    constructor(tab: TabItem) {
        super(tab);
    }
}
