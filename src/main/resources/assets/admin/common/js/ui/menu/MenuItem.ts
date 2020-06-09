import {LiEl} from '../../dom/LiEl';
import {Action} from '../Action';

export class MenuItem
    extends LiEl {

    private action: Action;

    private iconClass: string;

    constructor(action: Action) {
        super('menu-item');
        this.action = action;
        this.setLabel(this.action.getLabel());
        if (this.action.getTitle()) {
            this.setTitle(this.action.getTitle());
        }
        this.onClicked(() => {
            if (action.isEnabled()) {
                this.action.execute();
            }
        });
        this.setEnabled(action.isEnabled());

        this.updateIconClass(this.action.getIconClass());

        action.onPropertyChanged((changedAction: Action) => {
            this.setEnabled(changedAction.isEnabled());
            this.setVisible(changedAction.isVisible());
            this.setLabel(changedAction.getLabel());
            this.updateIconClass(changedAction.getIconClass());
        });
    }

    private updateIconClass(newIconClass: string) {
        if (newIconClass === this.iconClass) {
            return;
        }
        if (this.iconClass) {
            this.removeClass(this.iconClass);
        }
        this.iconClass = newIconClass;
        if (this.iconClass) {
            this.addClass(this.iconClass);
        }
    }

    setLabel(label: string) {
        this.getEl().setInnerHtml(label);
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
