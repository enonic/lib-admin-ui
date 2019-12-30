import {ResponsiveManager} from '../../ui/responsive/ResponsiveManager';
import {HideTabMenuEvent} from '../../ui/tab/HideTabMenuEvent';
import {TabMenu} from '../../ui/tab/TabMenu';
import {UlEl} from '../../dom/UlEl';
import {TabMenuItem} from '../../ui/tab/TabMenuItem';
import {AppBarTabMenuButton} from './AppBarTabMenuButton';
import {AppBarTabMenuItem} from './AppBarTabMenuItem';
import {AppBarTabId} from './AppBarTabId';

export class AppBarTabMenu
    extends TabMenu {

    static TAB_WIDTH: number = 190;

    static MAX_WIDTH: number = 248; // maximum width, when only one tab shown

    private appBarTabMenuButton: AppBarTabMenuButton;

    private barEl: UlEl;

    private buttonLabelChangedListeners: { (): void }[] = [];

    private timeoutHandler: number;

    constructor() {
        super('appbar-tab-menu');
        this.barEl = new UlEl('bar');
        this.prependChild(this.barEl);

        this.onRendered(() => {
            this.updateTabMenuButtonVisibility();
        });

        ResponsiveManager.onAvailableSizeChanged(this, this.moveTabs.bind(this, 50));
    }

    addNavigationItem(tab: AppBarTabMenuItem) {
        super.addNavigationItem(tab);

        this.appBarTabMenuButton.setTabCount(this.countVisible());
        this.appBarTabMenuButton.setEditing(tab.isEditing());

        this.moveTabs(0);
        this.makeTabFirst(tab);

        ResponsiveManager.fireResizeEvent();
    }

    removeNavigationItem(tab: AppBarTabMenuItem) {
        super.removeNavigationItem(tab);

        this.appBarTabMenuButton.setTabCount(this.countVisible());
        let newSelectedTab = <AppBarTabMenuItem>this.getSelectedNavigationItem();
        if (newSelectedTab) {
            this.appBarTabMenuButton.setEditing(newSelectedTab.isEditing());
        }

        this.moveTabs(0);

        ResponsiveManager.fireResizeEvent();
    }

    getNavigationItemById(tabId: AppBarTabId): AppBarTabMenuItem {
        let items: TabMenuItem[] = this.getNavigationItems();
        let item: AppBarTabMenuItem;
        for (let i = 0; i < items.length; i++) {
            item = <AppBarTabMenuItem>items[i];
            if (item.getTabId().equals(tabId)) {
                return item;
            }
        }
        return null;
    }

    getNavigationItemByIdValue(tabIdValue: string): AppBarTabMenuItem {
        let items: TabMenuItem[] = this.getNavigationItems();
        let item: AppBarTabMenuItem;
        for (let i = 0; i < items.length; i++) {
            item = <AppBarTabMenuItem>items[i];
            if (item.getTabId().getId() === tabIdValue) {
                return item;
            }
        }
        return null;
    }

    selectNavigationItem(tabIndex: number) {
        super.selectNavigationItem(tabIndex);
        const tab = <AppBarTabMenuItem>this.getNavigationItem(tabIndex);
        this.appBarTabMenuButton.setEditing(tab.isEditing());

        this.hideMenu();
        this.moveTabs();
        this.makeSelectedTabFirst(tab);
    }

    deselectNavigationItem() {
        super.deselectNavigationItem();
        this.appBarTabMenuButton.setEditing(false);
    }

    onButtonLabelChanged(listener: () => void) {
        this.buttonLabelChangedListeners.push(listener);
    }

    unButtonLabelChanged(listener: () => void) {
        this.buttonLabelChangedListeners = this.buttonLabelChangedListeners.filter((currentListener: () => void) => {
            return listener !== currentListener;
        });
    }

    protected createTabMenuButton(): AppBarTabMenuButton {
        this.appBarTabMenuButton = new AppBarTabMenuButton();
        return this.appBarTabMenuButton;
    }

    protected setButtonLabel(value: string): AppBarTabMenu {
        super.setButtonLabel(value);
        this.notifyButtonLabelChanged();
        return this;
    }

    protected handleClick(e: MouseEvent) {
        e.preventDefault();
        new HideTabMenuEvent(this).fire();
    }

    private updateTabMenuButtonVisibility() {
        let menuTabsCount = this.getMenuEl().getChildren().length;
        if (menuTabsCount === 0) {
            this.appBarTabMenuButton.hide();
            this.getMenuEl().hide();
        } else {
            this.appBarTabMenuButton.show();
        }
        this.appBarTabMenuButton.setTabCount(menuTabsCount);
    }

    private moveTabs(timeout: number = 0) {
        clearInterval(this.timeoutHandler);
        if (timeout > 0) {
            this.timeoutHandler = setTimeout(this.moveTabsHandler.bind(this), timeout);
        } else {
            this.moveTabsHandler();
        }
    }

    private moveTabsHandler() {
        const width = this.getEl().getWidth();
        const barWidth = this.barEl.getEl().getWidth();
        const exactTabs = AppBarTabMenu.MAX_WIDTH < width ? Math.ceil(barWidth / AppBarTabMenu.TAB_WIDTH) || 1 : 1;
        const barTabs = this.barEl.getChildren();
        const menuTabs = this.getMenuEl().getChildren();
        let tabsInBar = barTabs.length;
        let tabsInMenu = menuTabs.length;

        // escape condition
        while (!(exactTabs === tabsInBar || (exactTabs > tabsInBar && tabsInMenu === 0))) {

            if (exactTabs > tabsInBar) {
                if (tabsInMenu > 0) {
                    const tabEl = this.getMenuEl().getFirstChild();
                    this.getMenuEl().removeChild(tabEl);
                    this.barEl.appendChild(tabEl);
                    tabsInBar++;
                    tabsInMenu--;
                }
            } else if (exactTabs < tabsInBar) {
                if (tabsInBar > 0) {
                    const tabEl = this.barEl.getLastChild();
                    this.barEl.removeChild(tabEl);
                    this.getMenuEl().prependChild(tabEl);
                    tabsInBar--;
                    tabsInMenu++;
                }
            }
        }

        this.updateTabMenuButtonVisibility();
    }

    private makeSelectedTabFirst(tab: AppBarTabMenuItem) {
        if (this.getMenuEl().hasChild(tab)) {
            this.getMenuEl().removeChild(tab);
            this.barEl.prependChild(tab);
            this.moveTabs();
        }
    }

    private makeTabFirst(tab: AppBarTabMenuItem) {
        const menuWithTab = menuTab => this.getMenuEl().hasChild(menuTab) ? this.getMenuEl() : null;
        const barWithTab = barTab => this.barEl.hasChild(barTab) ? this.barEl : null;

        const elemWithTab = menuWithTab(tab) || barWithTab(tab);

        if (elemWithTab) {
            elemWithTab.removeChild(tab);
            this.barEl.prependChild(tab);
            this.moveTabs();
        }
    }

    private notifyButtonLabelChanged() {
        this.buttonLabelChangedListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }
}
