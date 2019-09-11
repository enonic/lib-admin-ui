import {ActionButton} from '../button/ActionButton';
import {Action} from '../Action';

export class DialogButton
    extends ActionButton {

    constructor(action: Action) {
        super(action, false);
        this.addClass('dialog-button');
    }
}
