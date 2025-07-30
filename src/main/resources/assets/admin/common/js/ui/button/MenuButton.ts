import * as Q from 'q';
import {Body} from '../../dom/Body';
import {DivEl} from '../../dom/DivEl';
import {Element} from '../../dom/Element';
import {Action} from '../Action';
import {Menu} from '../menu/Menu';
import {MenuItem} from '../menu/MenuItem';
import {AriaRole, WCAG} from '../WCAG';
import {ActionButton} from '../../ui2/ActionButton';
import {DropdownHandle} from './DropdownHandle';

export enum MenuButtonDropdownPos {
    LEFT, RIGHT
}

export interface MenuButtonConfig {
    defaultAction: Action;
    menuActions?: Action[];
    dropdownPosition?: MenuButtonDropdownPos
}

export class MenuButton
    extends DivEl {

    [WCAG]: boolean = true;
    role: AriaRole = AriaRole.NONE;
    tabbable: boolean = true;

    protected readonly defaultAction: Action;

    protected menuActions: Action[] = [];

    protected readonly dropdownPosition: MenuButtonDropdownPos;

    protected dropdownHandle: DropdownHandle;

    protected actionButton: ActionButton;

    protected menu: Menu;

    protected toggleMenuOnAction: boolean = false;

    private onBodyClicked: (e: MouseEvent) => void;

    private actionPropertyListener: () => void;

    protected readonly config: MenuButtonConfig;

    constructor(config: Action | MenuButtonConfig) {
        super('menu-button');

        if ('defaultAction' in config) {
            this.config = config;
            this.defaultAction = config.defaultAction;
            this.menuActions = config.menuActions || [];
            this.dropdownPosition = config.dropdownPosition || MenuButtonDropdownPos.LEFT;
        } else {
            this.defaultAction = config;
        }

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.onBodyClicked = (e) => this.hideMenuOnOutsideClick(e);
        this.actionPropertyListener = this.updateActionEnabled.bind(this);

        this.menu = new Menu(this.menuActions);
        this.menu.hide();

        this.initDropdownHandle();
        this.initActionButton();
        if (this.menuActions?.length > 0) {
            this.initActions(this.menuActions);
        }
    }

    protected getDefaultAction(): Action {
        return this.defaultAction;
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

    getChildControls(): Element[] {
        return [this.actionButton, this.dropdownHandle];
    }

    addMenuActions(actions: Action[]) {
        this.menu.addActions(actions);
        this.initActions(actions);
        this.menuActions = this.menu.getMenuItems().map(item => item.getAction());
    }

    removeMenuActions(actions: Action[]) {
        this.menu.removeActions(actions);
        this.releaseActions(actions);

        this.menuActions = this.menu.getMenuItems().map(item => item.getAction());
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
        Body.get().onContextMenu(this.onBodyClicked);
    }

    collapseMenu(): void {
        this.menu.hide();
        this.dropdownHandle.removeClass('down');
        Body.get().unClicked(this.onBodyClicked);
        Body.get().unContextMenu(this.onBodyClicked);
    }

    setDropdownHandleEnabled(enabled: boolean = true): void {
        //this.setRole(enabled ? AriaRole.MENU : AriaRole.BUTTON);
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

    private hideMenuOnOutsideClick(e: Event): void {
        if (!this.dropdownHandle.hasClass('down')) {
            return;
        }
        if (!this.getEl().contains(e.target as HTMLElement)) {
            // click outside menu
            this.collapseMenu();

            e.stopPropagation();
            e.preventDefault();
        }
    }

    private initDropdownHandle(): void {
        this.dropdownHandle = new DropdownHandle();
    }

    private initActionButton(): void {
        this.actionButton = new ActionButton({action: this.defaultAction});
    }

    protected setButtonAction(action: Action): void {
        this.actionButton.setAction(action);
    }

    private initActions(actions: Action[]): void {
        this.setDropdownHandleEnabled(this.getMenuActions().length > 0);

        this.updateActionEnabled();

        actions.forEach((action) => action.onPropertyChanged(this.actionPropertyListener));
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

        const onDropdownHandleClicked = () => {
            if (this.dropdownHandle.isEnabled()) {
                this.toggleMenu();
            }
        };
        this.dropdownHandle.onClicked(onDropdownHandleClicked);
        this.dropdownHandle.onEscPressed(() => this.collapseMenu());

        this.menu.onItemClicked((item: MenuItem) => {
            if (this.menu.isHideOnItemClick() && item.isEnabled()) {
                this.collapseMenu();
            }
        });

        const onActionButtonClicked = () => this.toggleMenuOnAction ? this.toggleMenu() : this.collapseMenu();
        this.actionButton.onClicked(onActionButtonClicked);

        this.menu.onClicked(() => this.dropdownHandle.giveFocus());
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const children: Element[] = [];

            if (this.dropdownPosition === MenuButtonDropdownPos.RIGHT) {
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
