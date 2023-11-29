import {ButtonEl} from '../../dom/ButtonEl';

export class DropdownHandle
    extends ButtonEl {

    private static CLASS_DOWN: string = 'down';

    constructor() {
        super('dropdown-handle');

        this.setEnabled(true);
        this.up();
        this.addClass('icon-arrow_drop_down');
    }

    down() {
        this.addClass(DropdownHandle.CLASS_DOWN);
    }

    up() {
        this.removeClass(DropdownHandle.CLASS_DOWN);
    }

    isDown(): boolean {
        return this.hasClass(DropdownHandle.CLASS_DOWN);
    }

    toggle(): void {
        if (this.isDown()) {
            this.up();
        } else {
            this.down();
        }
    }

    isUp(): boolean {
        return !this.isDown();
    }
}
