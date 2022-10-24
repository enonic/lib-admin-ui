import {UlEl} from '../../dom/UlEl';
import {Action} from '../Action';
import {MenuItem} from './MenuItem';

export class Menu
    extends UlEl {

    private menuItems: MenuItem[] = [];
    private hideOnItemClick: boolean = true;
    private itemClickListeners: { (item: MenuItem): void }[] = [];

    constructor(actions: Action[] = []) {
        super('menu');

        actions.forEach((action) => this.addAction(action));
    }

    isHideOnItemClick(): boolean {
        return this.hideOnItemClick;
    }

    getMenuItems() {
        return this.menuItems;
    }

    addAction(action: Action): Menu {
        const menuItem = this.createMenuItem(action);
        this.appendChild(menuItem);
        return this;
    }

    addActions(actions: Action[]): Menu {
        actions.forEach((action) => {
            this.addAction(action);
        });
        return this;
    }

    removeAction(action: Action): Menu {
        let menuItem = this.getMenuItem(action);
        if (menuItem) {
            this.removeMenuItem(menuItem);
            this.removeChild(menuItem);
        }
        return this;
    }

    removeActions(actions: Action[]): Menu {
        actions.forEach((action: Action) => {
            this.removeAction(action);
        });
        return this;
    }

    setActions(actions: Action[]): Menu {
        this.menuItems.length = 0;
        this.removeChildren();
        this.addActions(actions);
        return this;
    }

    setHideOnItemClick(hide: boolean): Menu {
        this.hideOnItemClick = hide;
        return this;
    }

    onItemClicked(listener: (item: MenuItem) => void) {
        this.itemClickListeners.push(listener);
    }

    unItemClicked(listener: (item: MenuItem) => void) {
        this.itemClickListeners = this.itemClickListeners.filter((currentListener: (item: MenuItem) => void) => {
            return listener !== currentListener;
        });
    }

    addSeparator() {
        this.toggleSeparator(true);
    }

    removeSeparator() {
        this.toggleSeparator(false);
    }

    public getMenuItem(action: Action): MenuItem {
        for (let i = 0; i < this.menuItems.length; i++) {
            let menuItem = this.menuItems[i];
            if (menuItem.getAction() === action) {
                return menuItem;
            }
        }
        return null;
    }

    private notifyItemClicked(item: MenuItem) {
        this.itemClickListeners.forEach((listener: (item: MenuItem) => void) => {
            listener(item);
        });
    }

    private toggleSeparator(toggle: boolean) {
        if (this.menuItems.length > 0) {
            this.menuItems[this.menuItems.length - 1].toggleClass('separated', toggle);
        }
    }

    private createMenuItem(action: Action): MenuItem {
        let menuItem = new MenuItem(action);
        menuItem.onClicked((event: MouseEvent) => {
            this.notifyItemClicked(menuItem);
            if (this.hideOnItemClick) {
                this.hide();
            }
            event.preventDefault();
            event.stopPropagation();
        });
        this.menuItems.push(menuItem);
        return menuItem;
    }

    private removeMenuItem(menuItem: MenuItem) {
        this.menuItems = this.menuItems.filter((item) => {
            return item !== menuItem;
        });
    }
}
