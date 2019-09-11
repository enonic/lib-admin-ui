import {Action} from '../../../ui/Action';
import {BrowsePanel} from '../BrowsePanel';

export class ToggleFilterPanelAction
    extends Action {

    constructor(browsePanel: BrowsePanel<any>) {
        super('');
        this.setIconClass('icon-search');
        this.setEnabled(true);
        this.onExecuted(() => {
            browsePanel.toggleFilterPanel();
        });
    }
}
