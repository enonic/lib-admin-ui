import {LiEl} from '../../dom/LiEl';
import {Action} from '../Action';

export class ActionMenuItem
    extends LiEl {

    private action: Action;

    constructor(action: Action, hideInactive: boolean = true) {

        super('action');
        this.action = action;

        this.getEl().setInnerHtml(this.action.getLabel());

        this.action.onPropertyChanged((a: Action) => {
            if (hideInactive) {
                this.updateVisibilityState();
            }
            this.getEl().setInnerHtml(a.getLabel());
        });

        this.onClicked(() => {
            this.action.execute();
        });

        if (hideInactive) {
            this.updateVisibilityState();
        }
    }

    private updateVisibilityState() {
        if (this.action.isEnabled()) {
            this.show();
        } else if (!this.action.isEnabled()) {
            this.hide();
        }
    }
}
