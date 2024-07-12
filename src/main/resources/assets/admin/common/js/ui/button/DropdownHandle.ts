import {ButtonEl} from '../../dom/ButtonEl';
import {AriaRole, IWCAG as WCAG} from '../WCAG';

export class DropdownHandle
    extends ButtonEl {
    [WCAG]: boolean = true;
    role: AriaRole = AriaRole.BUTTON;
    tabbable: boolean = true;

    constructor() {
        super('dropdown-handle');

        this.setEnabled(true);
        this.removeClass('down');
        this.addClass('icon-arrow_drop_down');
    }

    down() {
        this.addClass('down');
    }

    up() {
        this.removeClass('down');
    }
}
