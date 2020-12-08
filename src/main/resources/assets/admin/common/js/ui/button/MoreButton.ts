import {Menu} from '../menu/Menu';
import {MenuItem} from '../menu/MenuItem';
import {Action} from '../Action';
import {Button} from './Button';
import {IEl} from '../../dom/IEl';
import {Body} from '../../dom/Body';

export enum MenuPosition {
    LEFT, RIGHT
}

export class MoreButton
    extends Button {

    private actionPropertyListener: () => void;

    private outsideClickListener: (event: MouseEvent) => void;

    private menu: Menu;

    private icon: IEl;

    private position: MenuPosition;

    constructor(actions: Action[] = []) {
        super();
        this.addClass('more-button transparent');
        this.setMenuPosition(MenuPosition.LEFT);

        this.icon = new IEl('icon icon-more_vert icon-medium');

        this.actionPropertyListener = this.updateActionEnabled.bind(this);

        this.outsideClickListener = this.listenOutsideClick.bind(this);

        this.menu = new Menu();
        this.menu.setHideOnItemClick(false);
        this.addMenuActions(actions);

        this.initListeners();

        this.appendChildren(this.icon, this.menu);
    }

    setMenuPosition(position: MenuPosition): void {
        if (this.position && this.position !== position) {
            this.removeClass('menu-' + MenuPosition[this.position].toLowerCase());
            this.position = position;
        }
        this.addClass('menu-' + MenuPosition[position].toLowerCase());
    }

    addMenuActions(actions: Action[]) {
        this.menu.addActions(actions);
        this.bindActions(actions);
    }

    getMenuActions() {
        return this.menu.getMenuItems().map(item => item.getAction());
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
        if (expand || expand === undefined && !this.isMenuExpanded()) {
            this.expandMenu();
        } else {
            this.collapseMenu();
        }
    }

    expandMenu(): void {
        this.addClass('expanded');
        Body.get().onClicked(this.outsideClickListener);
    }

    collapseMenu(): void {
        this.removeClass('expanded');
        Body.get().unClicked(this.outsideClickListener);
    }

    isMenuExpanded(): boolean {
        return this.hasClass('expanded');
    }

    private setButtonEnabled(enabled: boolean = true) {
        this.setEnabled(enabled);
    }

    private bindActions(actions: Action[]) {
        this.setButtonEnabled(this.getMenuActions().length > 0);

        this.updateActionEnabled();

        actions.forEach((action) => action.onPropertyChanged(this.actionPropertyListener));
    }

    private releaseActions(actions: Action[]) {
        this.setButtonEnabled(this.getMenuActions().length > 0);

        this.updateActionEnabled();

        actions.forEach(action => action.unPropertyChanged(this.actionPropertyListener));
    }

    private updateActionEnabled() {
        let allActionsDisabled = this.getMenuActions().every((action) => !action.isEnabled());
        this.setButtonEnabled(!allActionsDisabled);
    }

    private listenOutsideClick(event: MouseEvent): void {
        if (!this.getEl().contains(<HTMLElement>event.target)) {
            this.collapseMenu();
        }
    }

    private initListeners() {
        this.icon.onClicked((_event: MouseEvent) => {
            const flag = !this.isMenuExpanded();
            this.toggleMenu(flag);
        });

        this.menu.onItemClicked((item: MenuItem) => {
            if (item.isEnabled()) {
                this.collapseMenu();
            }
        });
    }
}
