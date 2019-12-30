import {Menu} from '../menu/Menu';
import {MenuItem} from '../menu/MenuItem';
import {DivEl} from '../../dom/DivEl';
import {Action} from '../Action';
import {AppHelper} from '../../util/AppHelper';
import {DropdownHandle} from './DropdownHandle';
import {ActionButton} from './ActionButton';

export class MenuButton
    extends DivEl {

    private actionPropertyListener: () => void;

    private dropdownHandle: DropdownHandle;

    private actionButton: ActionButton;

    private menu: Menu;

    constructor(mainAction: Action, menuActions: Action[] = []) {
        super('menu-button');

        this.actionPropertyListener = this.updateActionEnabled.bind(this);

        this.menu = new Menu(menuActions);
        this.initDropdownHandle();
        this.initActionButton(mainAction);
        this.initActions(menuActions);

        this.initListeners();

        let children = [this.dropdownHandle, this.actionButton, this.menu];
        this.appendChildren(...children);
    }

    getActionButton(): ActionButton {
        return this.actionButton;
    }

    getMenuItem(action: Action): MenuItem {
        return this.menu.getMenuItem(action);
    }

    getDropdownHandle(): DropdownHandle {
        return this.dropdownHandle;
    }

    addMenuActions(actions: Action[]) {
        this.menu.addActions(actions);
        this.initActions(actions);
    }

    removeMenuActions(actions: Action[]) {
        this.menu.removeActions(actions);
        this.releaseActions(actions);
    }

    addMenuSeparator() {
        this.menu.addSeparator();
    }

    removeMenuSeparator() {
        this.menu.removeSeparator();
    }

    collapseMenu(): void {
        this.menu.removeClass('expanded');
        this.dropdownHandle.removeClass('down');
    }

    setDropdownHandleEnabled(enabled: boolean = true) {
        this.dropdownHandle.setEnabled(enabled);
        if (!enabled) {
            this.collapseMenu();
        }
    }

    hideDropdown(hidden: boolean = true) {
        this.toggleClass('hidden-dropdown', hidden);
    }

    minimize() {
        if (!this.hasClass('minimized')) {
            const action = this.actionButton.getAction();
            const actions = [action, ...this.getMenuActions()];
            this.menu.setActions(actions);
            action.onPropertyChanged(this.actionPropertyListener);
            this.addClass('minimized');
            this.updateActionEnabled();
        }
    }

    maximize() {
        if (this.hasClass('minimized')) {
            const action = this.actionButton.getAction();
            this.menu.removeAction(action);
            action.unPropertyChanged(this.actionPropertyListener);
            this.removeClass('minimized');
            this.updateActionEnabled();
        }
    }

    isMinimized() {
        return this.hasClass('minimized');
    }

    setEnabled(enable: boolean) {
        this.dropdownHandle.setEnabled(enable);
        this.actionButton.setEnabled(enable);
    }

    private initDropdownHandle() {
        this.dropdownHandle = new DropdownHandle();
    }

    private initActionButton(action: Action) {
        this.actionButton = new ActionButton(action);
    }

    private initActions(actions: Action[]) {
        this.setDropdownHandleEnabled(this.getMenuActions().length > 0);

        this.updateActionEnabled();

        actions.forEach((action) => {
            action.onPropertyChanged(this.actionPropertyListener);
        });
    }

    private releaseActions(actions: Action[]) {
        this.setDropdownHandleEnabled(this.getMenuActions().length > 0);

        this.updateActionEnabled();

        actions.forEach(action => {
            action.unPropertyChanged(this.actionPropertyListener);
        });
    }

    private getMenuActions() {
        return this.menu.getMenuItems().map(item => item.getAction());
    }

    private updateActionEnabled() {
        let allActionsDisabled = this.getMenuActions().every((action) => !action.isEnabled());
        this.setDropdownHandleEnabled(!allActionsDisabled);
    }

    private initListeners() {
        this.dropdownHandle.onClicked(() => {
            if (this.dropdownHandle.isEnabled()) {
                this.menu.toggleClass('expanded');
                this.dropdownHandle.toggleClass('down');
            }
        });

        this.menu.onItemClicked((item: MenuItem) => {
            if (this.menu.isHideOnItemClick() && item.isEnabled()) {
                this.collapseMenu();
            }
        });

        this.actionButton.onClicked(() => this.collapseMenu());

        this.dropdownHandle.onClicked(() => this.dropdownHandle.giveFocus());

        this.menu.onClicked(() => this.dropdownHandle.giveFocus());

        AppHelper.focusInOut(this, () => this.collapseMenu());
    }
}
