import {LiEl} from '../../dom/LiEl';
import {Action} from '../Action';

export class MenuItem
    extends LiEl {

    private action: Action;

    constructor(action: Action) {
        super('menu-item');
        this.action = action;
        this.setLabel(this.action.getLabel());
        this.onClicked(() => {
            if (action.isEnabled()) {
                this.action.execute();
            }
        });
        this.setEnabled(action.isEnabled());

        action.onPropertyChanged((changedAction: Action) => {
            this.setEnabled(changedAction.isEnabled());
            this.setVisible(changedAction.isVisible());
            this.setLabel(changedAction.getLabel());
        });
    }

    setLabel(label: string) {
        this.getEl().setInnerHtml(label, false);
    }

    getAction(): Action {
        return this.action;
    }

    setEnabled(value: boolean) {
        let el = this.getEl();
        el.setDisabled(!value);
        if (value) {
            el.removeClass('disabled');
        } else {
            el.addClass('disabled');
        }
    }

    isEnabled(): boolean {
        return this.action.isEnabled();
    }
}
