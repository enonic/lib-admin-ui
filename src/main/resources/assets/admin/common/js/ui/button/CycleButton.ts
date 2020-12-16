import {Button} from './Button';
import {Action} from '../Action';
import {StyleHelper} from '../../StyleHelper';

export class CycleButton
    extends Button {

    private readonly actionList: Action[];

    private active: number;

    constructor(actions: Action[]) {
        super();
        this.addClass('cycle-button icon-medium ' + StyleHelper.getIconCls('screen'));
        this.actionList = actions;

        if (this.actionList.length > 0) {
            this.active = -1;
            this.updateActive();
            this.setTitle(this.actionList[this.active].getTitle());

            this.onClicked(() => {
                this.doAction();
                this.setAndShowTitle();
            });
        }
    }

    setEnabled(value: boolean) {
        super.setEnabled(value);

        this.setTitle(value ? this.actionList[this.active].getTitle() : '', false);

        return this;
    }

    executePrevAction() {
        let prev = this.active - 1;
        prev = prev < 0 ? this.actionList.length - 1 : prev;

        if (this.actionList.length > 0) {
            this.actionList[prev].execute();
        }
    }

    selectActiveAction(action: Action) {
        for (let i = 0; i < this.actionList.length; i++) {
            if (this.actionList[i] === action) {
                this.active = i;
                this.updateActive();
                this.setTitle(this.actionList[this.active].getTitle(), false);

                return;
            }
        }
        console.warn('Action not found in CycleButton', action);
    }

    private doAction() {
        this.actionList[this.active].execute();
        this.updateActive();
    }

    private removeAndHdeTitle() {
        if (this.actionList[this.active].getTitle()) {
            this.setTitle('');
        }
    }

    private setAndShowTitle() {
        const title = this.actionList[this.active].getTitle();
        this.setTitle(title || '', false);
    }

    private updateActive() {
        const prevName = this.actionList[this.active] ? this.actionList[this.active].getLabel().toLowerCase() : '';

        this.active++;

        if (this.active >= this.actionList.length) {
            this.active = 0;
        }
        const name = this.actionList[this.active] ? this.actionList[this.active].getLabel().toLowerCase() : '';

        if (prevName) {
            this.removeClass(prevName);
        }
        if (name) {
            this.addClass(name);
        }
    }

}
