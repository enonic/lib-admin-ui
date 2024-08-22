import {MenuButton, MenuButtonConfig} from '../button/MenuButton';
import {ButtonRow} from './ModalDialog';
import {Action} from '../Action';

export class DropdownButtonRow
    extends ButtonRow {

    protected actionMenu: MenuButton;

    constructor() {
        super();
        this.addClass('dropdown-button-row');
    }

    makeActionMenu(menuButtonConfig: MenuButtonConfig, useDefault: boolean = true): MenuButton {
        if (!this.actionMenu) {
            this.actionMenu = new MenuButton(menuButtonConfig);

            if (useDefault) {
                this.setDefaultElement(this.actionMenu.getActionButton());
            }

            this.actionMenu.addClass('dropdown-dialog-menu');
            this.actionMenu.getDropdownHandle().addClass('no-animation');
            this.addElement(this.actionMenu);
        }

        return this.actionMenu;
    }

    getActionMenu(): MenuButton {
        return this.actionMenu;
    }

    getMenuActions(): Action[] {
        return this.actionMenu.getMenuActions();
    }
}
