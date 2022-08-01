import {ButtonEl} from '../../dom/ButtonEl';

export class DropdownHandle
    extends ButtonEl {

    constructor() {
        super('dropdown-handle');

        this.setEnabled(true);
        this.removeClass('down');
    }

    down() {
        this.addClass('down');
    }

    up() {
        this.removeClass('down');
    }
}
