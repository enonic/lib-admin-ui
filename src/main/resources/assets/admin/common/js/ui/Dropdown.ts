import {SelectEl} from '../dom/SelectEl';
import {OptionEl} from '../dom/OptionEl';

export class Dropdown
    extends SelectEl {

    constructor(name: string) {
        super();
        this.setName(name);

        this.onChange(() => {
            this.refreshDirtyState();
            this.refreshValueChanged();
        });
    }

    addOption(value: string, displayName: string) {
        let option = new DropdownOption(value, displayName);
        this.appendChild(option);
    }
}

export class DropdownOption
    extends OptionEl {
    constructor(value: string, displayName: string) {
        super(value, displayName);
    }
}
