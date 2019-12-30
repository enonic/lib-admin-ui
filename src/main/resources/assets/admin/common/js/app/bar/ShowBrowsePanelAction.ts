import {Action} from '../../ui/Action';
import {ShowBrowsePanelEvent} from '../ShowBrowsePanelEvent';

export class ShowBrowsePanelAction
    extends Action {

    constructor() {
        super('Browse');

        this.onExecuted(() => {
            new ShowBrowsePanelEvent().fire();
        });
    }
}
