import {Menu} from '../menu/Menu';
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

    private actionExecutedListener: (action: Action) => void;

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

        this.actionExecutedListener = (_action: Action) => this.collapseMenu();

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

    prependMenuActions(actions: Action[]) {
        const currentActions = this.menu.getMenuItems().map(i => i.getAction());
        this.menu.setActions([].concat(actions, currentActions));
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

        actions.forEach((action) => {
            action.onPropertyChanged(this.actionPropertyListener);
            action.onExecuted(this.actionExecutedListener);
        });
    }

    private releaseActions(actions: Action[]) {
        this.setButtonEnabled(this.getMenuActions().length > 0);

        this.updateActionEnabled();

        actions.forEach(action => {
            action.unPropertyChanged(this.actionPropertyListener);
            action.unExecuted(this.actionExecutedListener);
        });
    }

    private updateActionEnabled() {
        let allActionsDisabled = this.getMenuActions().every((action) => !action.isEnabled());
        this.setButtonEnabled(!allActionsDisabled);
    }

    private listenOutsideClick(event: MouseEvent): void {
        if (!this.getEl().contains(event.target as HTMLElement)) {
            this.collapseMenu();
        }
    }

    private initListeners() {
        this.icon.onClicked((_event: MouseEvent) => {
            const flag = !this.isMenuExpanded();
            this.toggleMenu(flag);
        });
    }
}
