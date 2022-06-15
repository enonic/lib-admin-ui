import {Menu} from '../menu/Menu';
import {MenuItem} from '../menu/MenuItem';
import {DivEl} from '../../dom/DivEl';
import {Action} from '../Action';
import {DropdownHandle} from './DropdownHandle';
import {ActionButton} from './ActionButton';
import {Body} from '../../dom/Body';
import {Element} from '../../dom/Element';
import * as Q from 'q';

export enum MenuButtonDropdownPos {
    LEFT, RIGHT
}

export class MenuButton
    extends DivEl {

    protected readonly mainAction: Action;

    protected readonly menuActions: Action[];

    protected dropdownHandle: DropdownHandle;

    protected actionButton: ActionButton;

    protected menu: Menu;

    protected toggleMenuOnAction: boolean = false;

    private onBodyClicked: (e: MouseEvent) => void;

    private actionPropertyListener: () => void;

    constructor(mainAction: Action, menuActions: Action[] = []) {
        super('menu-button');

        this.mainAction = mainAction;
        this.menuActions = menuActions;

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.onBodyClicked = (e) => this.hideMenuOnOutsideClick(e);
        // Body.get().onClicked(this.onBodyClicked);
        this.actionPropertyListener = this.updateActionEnabled.bind(this);

        this.menu = new Menu(this.menuActions);
        this.menu.hide();

        this.initDropdownHandle();
        this.initActionButton(this.mainAction);
        this.initActions(this.menuActions);
    }

    getActionButton(): ActionButton {
        return this.actionButton;
    }

    getMenuItems(): MenuItem[] {
        return this.menu.getMenuItems();
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

    addMenuSeparator(): void {
        this.menu.addSeparator();
    }

    removeMenuSeparator(): void {
        this.menu.removeSeparator();
    }

    toggleMenu(expand?: boolean): void {
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
        Body.get().onClicked(this.onBodyClicked);
    }

    collapseMenu(): void {
        this.menu.hide();
        this.dropdownHandle.removeClass('down');
        Body.get().unClicked(this.onBodyClicked);
    }

    setDropdownHandleEnabled(enabled: boolean = true): void {
        this.dropdownHandle.setEnabled(enabled);
        if (!enabled) {
            this.collapseMenu();
        }
    }

    hideDropdown(hidden: boolean = true): void {
        this.toggleClass('hidden-dropdown', hidden);
    }

    minimize(): void {
        if (!this.hasClass('minimized')) {
            const action = this.actionButton.getAction();
            const actions = [action, ...this.getMenuActions()];
            this.menu.setActions(actions);
            action.onPropertyChanged(this.actionPropertyListener);
            this.addClass('minimized');
            this.updateActionEnabled();
        }
    }

    maximize(): void {
        if (this.hasClass('minimized')) {
            const action = this.actionButton.getAction();
            this.menu.removeAction(action);
            action.unPropertyChanged(this.actionPropertyListener);
            this.removeClass('minimized');
            this.updateActionEnabled();
        }
    }

    isMinimized(): boolean {
        return this.hasClass('minimized');
    }

    setEnabled(enable: boolean): void {
        this.dropdownHandle.setEnabled(enable);
        this.actionButton.setEnabled(enable);
    }

    setToggleMenuOnAction(value: boolean): void {
        this.toggleMenuOnAction = value;
    }

    protected getDropdownPosition(): MenuButtonDropdownPos {
        return MenuButtonDropdownPos.LEFT;
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

    private initDropdownHandle(): void {
        this.dropdownHandle = new DropdownHandle();
    }

    private initActionButton(action: Action): void {
        this.actionButton = new ActionButton(action);
    }

    private initActions(actions: Action[]): void {
        this.setDropdownHandleEnabled(this.getMenuActions().length > 0);

        this.updateActionEnabled();

        actions.forEach((action) => {
            action.onPropertyChanged(this.actionPropertyListener);
        });
    }

    private releaseActions(actions: Action[]): void {
        this.setDropdownHandleEnabled(this.getMenuActions().length > 0);

        this.updateActionEnabled();

        actions.forEach(action => {
            action.unPropertyChanged(this.actionPropertyListener);
        });
    }

    public getMenuActions(): Action[] {
        return this.menu.getMenuItems().map(item => item.getAction());
    }

    private updateActionEnabled(): void {
        const allActionsDisabled: boolean = this.getMenuActions().every((action) => !action.isEnabled());
        this.setDropdownHandleEnabled(!allActionsDisabled);
    }

    protected initListeners(): void {
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

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const children: Element[] = [];

            if (this.getDropdownPosition() === MenuButtonDropdownPos.RIGHT) {
                children.push(this.actionButton, this.dropdownHandle);
            } else {
                children.push(this.dropdownHandle, this.actionButton);
            }

            children.push(this.menu);

            this.appendChildren(...children);

            return rendered;
        });
    }
}
