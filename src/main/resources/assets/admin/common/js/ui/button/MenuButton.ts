import {Menu} from '../menu/Menu';
import {MenuItem} from '../menu/MenuItem';
import {DivEl} from '../../dom/DivEl';
import {Action} from '../Action';
import {AppHelper} from '../../util/AppHelper';
import {DropdownHandle} from './DropdownHandle';
import {ActionButton} from './ActionButton';
import {ResponsiveManager} from '../responsive/ResponsiveManager';
import {Body} from '../../dom/Body';

export class MenuButton
    extends DivEl {

    private actionPropertyListener: () => void;

    private dropdownHandle: DropdownHandle;

    private actionButton: ActionButton;

    private menu: Menu;

    private toggleMenuOnAction: boolean = false;

    protected autoWidth: boolean = false;

    protected rightAligned: boolean = false;

    constructor(mainAction: Action, menuActions: Action[] = []) {
        super('menu-button');

        this.actionPropertyListener = this.updateActionEnabled.bind(this);

        this.menu = new Menu(menuActions);
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
        if (expand || expand === undefined && !this.menu.hasClass('expanded')) {
            this.expandMenu();
        } else {
            this.collapseMenu();
        }
    }

    expandMenu(): void {
        this.menu.addClass('expanded');
        this.setMenuPosition();
        this.dropdownHandle.addClass('down');
        this.dropdownHandle.giveFocus();
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

    setMenuPosition() {
        const hostOffset = this.getEl().getOffset();
        const hostWidth = this.getEl().getWidth();
        const hostHeight = this.getEl().getHeightWithBorder();
        const leftBorderWidth = this.getEl().getBorderLeftWidth();
        const menuWidth = this.menu.getEl().getWidth();
        this.menu.getEl()
            .setWidth(this.autoWidth ? 'auto' : `${hostWidth}px`)
            .setTopPx(Math.ceil(hostOffset.top + hostHeight));

        if (this.rightAligned) {
            this.menu.getEl().setLeftPx(Math.ceil(hostOffset.left + leftBorderWidth + hostWidth - menuWidth))
        } else {
            this.menu.getEl().setLeftPx(Math.ceil(hostOffset.left + leftBorderWidth))
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
                this.toggleMenu();
            }
        });

        this.menu.onItemClicked((item: MenuItem) => {
            if (this.menu.isHideOnItemClick() && item.isEnabled()) {
                this.collapseMenu();
            }
        });

        this.actionButton.onClicked(() => {
            if (this.toggleMenuOnAction) {
                this.toggleMenu();
            } else {
                this.collapseMenu();
            }
        });

        this.menu.onClicked(() => this.dropdownHandle.giveFocus());

        AppHelper.focusInOut(this, () => this.collapseMenu());

        ResponsiveManager.onAvailableSizeChanged(Body.get(), () => {
            if (this.menu.hasClass('expanded')) {
                this.setMenuPosition();
            }
        });
    }
}
