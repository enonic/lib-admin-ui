import {AppHelper} from '../../util/AppHelper';
import {DivEl} from '../../dom/DivEl';
import {Navigator} from '../Navigator';
import {UlEl} from '../../dom/UlEl';
import {Body} from '../../dom/Body';
import {TabMenuButton} from './TabMenuButton';
import {TabMenuItem} from './TabMenuItem';
import {NavigatorEvent} from '../NavigatorEvent';
import {KeyHelper} from '../KeyHelper';
import {TabBarItem} from './TabBarItem';
import {HideTabMenuEvent} from './HideTabMenuEvent';
import {TabItemSelectedEvent} from './TabItemSelectedEvent';
import {TabItemLabelChangedEvent} from './TabItemLabelChangedEvent';

export class TabMenu
    extends DivEl
    implements Navigator {

    private tabMenuButton: TabMenuButton;

    private menuEl: UlEl;

    private menuVisible: boolean = false;

    private tabs: TabMenuItem[] = [];

    private selectedTab: number;

    private hideOnItemClick: boolean = true;

    private navigationItemAddedListeners: ((event: NavigatorEvent) => void)[] = [];

    private navigationItemRemovedListeners: ((event: NavigatorEvent) => void)[] = [];

    private navigationItemSelectedListeners: ((event: NavigatorEvent) => void)[] = [];

    private navigationItemDeselectedListeners: ((event: NavigatorEvent) => void)[] = [];

    private enabled: boolean = true;

    private focusIndex: number = -1;

    constructor(className?: string) {
        super('tab-menu' + (className ? ' ' + className : ''));

        this.initTabMenuButton();
        this.menuEl = new UlEl('menu');

        this.appendChild(this.tabMenuButton);
        this.appendChild(this.menuEl);

        this.initListeners();
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    giveFocusToMenu(): boolean {
        const first = this.tabs[0];

        if (first) {
            this.focusIndex = 0;
            return first.giveFocus();
        }
        return false;
    }

    returnFocusFromMenu(): boolean {
        return this.giveFocus();
    }

    getFocusedTab(): TabMenuItem {
        return this.tabs[this.focusIndex];
    }

    focusNextTab(): boolean {
        const tabIndex = this.focusIndex + 1;

        if (tabIndex < this.tabs.length) {
            const focused = this.tabs[tabIndex].giveFocus();
            this.focusIndex = tabIndex;
            return focused || this.focusNextTab();
        }
        return false;
    }

    focusPreviousTab(): boolean {
        const tabIndex = this.focusIndex - 1;

        if (tabIndex >= 0) {
            const focused = this.tabs[tabIndex].giveFocus();
            this.focusIndex = tabIndex;
            return focused || this.focusPreviousTab();
        }
        return this.returnFocusFromMenu();
    }

    isKeyNext(event: KeyboardEvent): boolean {
        return KeyHelper.isArrowRightKey(event);
    }

    isKeyPrevious(event: KeyboardEvent): boolean {
        return KeyHelper.isArrowLeftKey(event);
    }

    setEnabled(enabled: boolean): TabMenu {
        this.enabled = enabled;
        this.toggleClass('disabled', !enabled);
        return this;
    }

    setButtonClass(cls: string): TabMenu {
        this.tabMenuButton.addClass(cls);
        return this;
    }

    setHideOnItemClick(hide: boolean): TabMenu {
        this.hideOnItemClick = hide;
        return this;
    }

    getTabMenuButtonEl(): TabMenuButton {
        return this.tabMenuButton;
    }

    getMenuEl(): UlEl {
        return this.menuEl;
    }

    isMenuVisible(): boolean {
        return this.menuVisible;
    }

    insertNavigationItem(tab: TabMenuItem, index: number) {
        this.tabs.splice(index, 0, tab);
        tab.setIndex(index);

        this.tabs.slice(index + 1).forEach((slicedTab: TabBarItem) => {
            slicedTab.setIndex(slicedTab.getIndex() + 1);
        });

        if (tab.isVisibleInMenu()) {
            this.menuEl.insertChild(tab, index);
            this.tabMenuButton.show();
        }
        this.initializeNewItemEvents(tab);
    }

    addNavigationItem(tab: TabMenuItem) {
        this.insertNavigationItem(tab, this.tabs.length);
    }

    prependNavigationItem(tab: TabMenuItem) {
        this.tabs.unshift(tab);
        this.tabs.forEach((curTab: TabMenuItem) => {
            curTab.setIndex(curTab.getIndex() + 1);
        });
        tab.setIndex(0);

        if (tab.isVisibleInMenu()) {
            this.menuEl.prependChild(tab);
            this.tabMenuButton.show();
        }

        this.initializeNewItemEvents(tab);
    }

    isEmpty(): boolean {
        return this.tabs.length === 0;
    }

    getSize(): number {
        return this.tabs.length;
    }

    countVisible(): number {
        let size = 0;
        this.tabs.forEach((tab: TabMenuItem) => {
            if (tab.isVisibleInMenu()) {
                size++;
            }
        });
        return size;
    }

    getSelectedNavigationItem(): TabMenuItem {
        return this.tabs[this.selectedTab];
    }

    getSelectedIndex(): number {
        return this.selectedTab;
    }

    getNavigationItem(tabIndex: number): TabMenuItem {
        return this.tabs[tabIndex];
    }

    getNavigationItems(): TabMenuItem[] {
        return this.tabs;
    }

    removeNavigationItem(tab: TabMenuItem) {
        tab.remove();

        this.tabs.splice(tab.getIndex(), 1);

        if (this.isEmpty()) {
            // if there are no tabs set selected index to negative value
            this.selectedTab = -1;
        } else if (tab.getIndex() < this.selectedTab) {
            // if removed tab was before selected tab than decrement selected index
            this.selectedTab--;
        } else if (tab.getIndex() > this.getSize() - 1 && this.selectedTab > 0) {
            // if selected index is more than tabs amount set last index as selected
            this.selectedTab = this.getSize() - 1;
        }

        // update indexes for tabs that have been after the removed tab
        for (let i = tab.getIndex(); i < this.tabs.length; i++) {
            this.tabs[i].setIndex(i);
        }

        if (this.countVisible() === 0) {
            this.setButtonLabel('');
            this.tabMenuButton.hide();
            this.hideMenu();
        } else {
            let newTab = this.getSelectedNavigationItem();
            if (newTab) {
                this.setButtonLabel(newTab.getLabel());
                this.updateActiveTab(newTab.getIndex());
                this.selectNavigationItem(newTab.getIndex());
            }
        }
        this.notifyTabRemovedListeners(tab);
    }

    removeNavigationItems() {
        this.tabs.forEach((tab: TabMenuItem) => {
            tab.remove();
            this.notifyTabRemovedListeners(tab);
        });

        if (this.countVisible() === 0) {
            this.setButtonLabel('');
            this.tabMenuButton.hide();
            this.hideMenu();
        }

        this.selectedTab = -1;
        this.tabs = [];
    }

    resetItemsVisibility() {
        let items = this.getNavigationItems();
        if (!!items) {
            items.forEach(item => {
                if (!item.isVisibleInMenu()) {
                    item.setVisibleInMenu(true);
                }
            });
        }
    }

    updateActiveTab(tabIndex: number) {
        this.tabs.forEach((tab: TabMenuItem, index: number) => {
            let activate = (tabIndex === index);
            tab.setActive(activate);
        });
    }

    selectNavigationItem(tabIndex: number, silent?: boolean) {
        if (tabIndex < 0 || tabIndex >= this.getSize() || this.selectedTab === tabIndex) {
            return;
        }

        this.selectedTab = tabIndex;
        let selectedTab = this.getNavigationItem(tabIndex);
        this.setButtonLabel(selectedTab.getLabel());
        this.updateActiveTab(tabIndex);

        if (!silent) {
            this.notifyTabSelectedListeners(selectedTab);
        }
    }

    deselectNavigationItem() {
        let selectedTab = this.getSelectedNavigationItem();
        this.selectedTab = -1;
        this.updateActiveTab(this.selectedTab);

        this.notifyTabDeselectedListeners(selectedTab);
    }

    onNavigationItemAdded(listener: (event: NavigatorEvent) => void) {
        this.navigationItemAddedListeners.push(listener);
    }

    onNavigationItemRemoved(listener: (event: NavigatorEvent) => void) {
        this.navigationItemRemovedListeners.push(listener);
    }

    onNavigationItemSelected(listener: (event: NavigatorEvent) => void) {
        this.navigationItemSelectedListeners.push(listener);
    }

    onNavigationItemDeselected(listener: (event: NavigatorEvent) => void) {
        this.navigationItemDeselectedListeners.push(listener);
    }

    unNavigationItemAdded(listener: (event: NavigatorEvent) => void) {
        this.navigationItemAddedListeners =
            this.navigationItemAddedListeners.filter((currentListener: (event: NavigatorEvent) => void) => {
                return listener !== currentListener;
            });
    }

    unNavigationItemRemoved(listener: (event: NavigatorEvent) => void) {
        this.navigationItemRemovedListeners =
            this.navigationItemRemovedListeners.filter((currentListener: (event: NavigatorEvent) => void) => {
                return listener !== currentListener;
            });
    }

    unNavigationItemSelected(listener: (event: NavigatorEvent) => void) {
        this.navigationItemSelectedListeners =
            this.navigationItemSelectedListeners.filter((currentListener: (event: NavigatorEvent) => void) => {
                return listener !== currentListener;
            });
    }

    unNavigationItemDeselected(listener: (event: NavigatorEvent) => void) {
        this.navigationItemDeselectedListeners =
            this.navigationItemDeselectedListeners.filter((currentListener: (event: NavigatorEvent) => void) => {
                return listener !== currentListener;
            });
    }

    protected initListeners() {
        AppHelper.focusInOut(this, () => {
            this.hideMenu();
        });

        this.onClicked((e: MouseEvent) => {
            if (this.enabled) {
                this.handleClick(e);
            }
        });

        this.menuEl.onKeyDown((event: KeyboardEvent) => this.handleMenuKeyDown(event));

        Body.get().onClicked((event: MouseEvent) => this.hideMenuOnOutsideClick(event));
    }

    protected handleMenuKeyDown(event: KeyboardEvent) {
        if (this.isKeyNext(event)) {
            this.focusNextTab();
        } else if (this.isKeyPrevious(event)) {
            this.focusPreviousTab();
        } else if (KeyHelper.isApplyKey(event)) {
            const tab = this.getFocusedTab();
            if (tab) {
                tab.select();
            }
        } else if (KeyHelper.isEscKey(event) && this.isMenuVisible()) {
            this.hideMenu();
        }

        AppHelper.lockEvent(event);
    }

    protected createTabMenuButton(): TabMenuButton {
        return new TabMenuButton();
    }

    protected setButtonLabel(value: string): TabMenu {
        this.tabMenuButton.setLabel(value);
        return this;
    }

    protected handleClick(e: MouseEvent) {
        // menu itself was clicked so do nothing
        e.preventDefault();
        new HideTabMenuEvent(this).fire();
    }

    protected toggleMenu() {
        if (!this.menuVisible) {
            this.showMenu();
        } else {
            this.hideMenu();
        }
    }

    protected hideMenu() {
        this.menuEl.hide();
        this.menuVisible = false;
        this.removeClass('expanded');
    }

    protected showMenu() {
        this.menuEl.show();
        this.menuVisible = true;
        this.addClass('expanded');
    }

    private initTabMenuButton() {
        this.tabMenuButton = this.createTabMenuButton();
        this.tabMenuButton.hide();
        this.tabMenuButton.addClass('tab-menu-button');

        this.tabMenuButton.onClicked(() => {
            if (this.enabled) {
                this.toggleMenu();
            }
        });
    }

    private initializeNewItemEvents(tab: TabMenuItem) {
        tab.onSelected((event: TabItemSelectedEvent) => {
            this.selectNavigationItem(event.getTab().getIndex());
            if (this.hideOnItemClick) {
                this.hideMenu();
            }
        });
        tab.onLabelChanged((event: TabItemLabelChangedEvent) => {
            if (tab.getIndex() === this.getSelectedIndex()) {
                this.setButtonLabel(event.getNewValue());
            }
        });

        this.notifyTabAddedListeners(tab);
    }

    private hideMenuOnOutsideClick(evt: Event): void {
        if (this.isMenuVisible() && !this.getEl().contains(evt.target as HTMLElement)) {
            // click outside menu
            this.hideMenu();
        }
    }

    private notifyTabAddedListeners(tab: TabMenuItem) {
        this.navigationItemAddedListeners.forEach((listener: (event: NavigatorEvent) => void) => {
            listener.call(this, new NavigatorEvent(tab));
        });
    }

    private notifyTabRemovedListeners(tab: TabMenuItem) {
        this.navigationItemRemovedListeners.forEach((listener: (event: NavigatorEvent) => void) => {
            listener.call(this, new NavigatorEvent(tab));
        });
    }

    private notifyTabSelectedListeners(tab: TabMenuItem) {
        this.navigationItemSelectedListeners.forEach((listener: (event: NavigatorEvent) => void) => {
            listener.call(this, new NavigatorEvent(tab));
        });
    }

    private notifyTabDeselectedListeners(tab: TabMenuItem) {
        this.navigationItemDeselectedListeners.forEach((listener: (event: NavigatorEvent) => void) => {
            listener.call(this, new NavigatorEvent(tab));
        });
    }
}
