import {Menu} from '../menu/Menu';
import {MenuItem} from '../menu/MenuItem';
import {DivEl} from '../../dom/DivEl';
import {Action} from '../Action';
import {DropdownHandle} from './DropdownHandle';
import {ActionButton} from './ActionButton';
import {Body} from '../../dom/Body';

export class MenuButton
    extends DivEl {

    private readonly actionPropertyListener: () => void;

    private dropdownHandle: DropdownHandle;

    private actionButton: ActionButton;

    private readonly menu: Menu;

    private toggleMenuOnAction: boolean = false;

    private onBodyClicked: (e: MouseEvent) => void;

    constructor(mainAction: Action, menuActions: Action[] = []) {
        super('menu-button');

        this.onBodyClicked = (e) => this.hideMenuOnOutsideClick(e);
        Body.get().onClicked(this.onBodyClicked);
        this.actionPropertyListener = this.updateActionEnabled.bind(this);

        this.menu = new Menu(menuActions);
        this.menu.hide();

        this.initDropdownHandle();
        this.initActionButton(mainAction);
        this.initActions(menuActions);

        this.initListeners();

        let children = [this.actionButton, this.dropdownHandle, this.menu];
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

    toggleMenu(expand?: boolean) {
        if (expand || expand === undefined && !this.menu.isVisible()) {
            this.expandMenu();
        } else {
            this.collapseMenu();
        }
    }

    expandMenu(): void {
        this.menu.resolveDropdownPosition();
        this.menu.show();
        this.dropdownHandle.addClass('down');
        this.dropdownHandle.giveFocus();
        //Body.get().onClicked(this.onBodyClicked);
    }

    collapseMenu(): void {
        this.menu.hide();
        this.dropdownHandle.removeClass('down');
        //Body.get().unClicked(this.onBodyClicked);
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

    setToggleMenuOnAction(value: boolean) {
        this.toggleMenuOnAction = value;
    }

    private hideMenuOnOutsideClick(e: Event): void {
        if (!this.dropdownHandle.hasClass('down')) {
            return;
        }
        if (!this.getEl().contains(<HTMLElement> e.target)) {
            // click outside menu
            this.collapseMenu();

            e.stopPropagation();
            e.preventDefault();
        }
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

    public getMenuActions() {
        return this.menu.getMenuItems().map(item => item.getAction());
    }

    private updateActionEnabled() {
        let allActionsDisabled = this.getMenuActions().every((action) => !action.isEnabled());
        this.setDropdownHandleEnabled(!allActionsDisabled);
    }

    private initListeners() {
        this.onBodyClicked = (e) => this.hideMenuOnOutsideClick(e);

        this.dropdownHandle.onClicked((e: MouseEvent) => {
            if (this.dropdownHandle.isEnabled()) {
                this.toggleMenu();
                e.stopPropagation();
                e.preventDefault();
            }
        });

        this.menu.onItemClicked((item: MenuItem) => {
            if (this.menu.isHideOnItemClick() && item.isEnabled()) {
                this.collapseMenu();
            }
        });

        this.actionButton.onClicked((e) => {
            if (this.toggleMenuOnAction) {
                this.toggleMenu();
            } else {
                this.collapseMenu();
            }
        });

        this.menu.onClicked(() => this.dropdownHandle.giveFocus());
    }
}
