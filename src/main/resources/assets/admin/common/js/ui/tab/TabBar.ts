import {UlEl} from '../../dom/UlEl';
import {Navigator} from '../Navigator';
import {TabBarItem} from './TabBarItem';
import {NavigatorEvent} from '../NavigatorEvent';
import {ActivatedEvent} from '../ActivatedEvent';
import {TabItemEvent} from './TabItemEvent';

export class TabBar
    extends UlEl
    implements Navigator {

    private scrollEnabled: boolean = true;

    private tabs: TabBarItem[] = [];

    private selectedIndex: number = -1;

    private navigationItemAddedListeners: ((event: NavigatorEvent) => void)[] = [];

    private navigationItemRemovedListeners: ((index: number) => void)[] = [];

    private navigationItemSelectedListeners: ((event: NavigatorEvent) => void)[] = [];

    private navigationItemActivatedListeners: ((event: ActivatedEvent) => void)[] = [];

    constructor(classes?: string) {
        super('tab-bar' + (!classes ? '' : ' ' + classes));
    }

    setScrollEnabled(enabled: boolean) {
        this.scrollEnabled = enabled;
    }

    insertNavigationItem(tab: TabBarItem, index: number, silent?: boolean) {
        this.tabs.splice(index, 0, tab);
        tab.setIndex(index);

        this.tabs.slice(index + 1).forEach((slicedTab: TabBarItem) => {
            slicedTab.setIndex(slicedTab.getIndex() + 1);
        });

        this.insertChild(tab, index);
        tab.onSelected((event: TabItemEvent) => {
            this.selectNavigationItem(event.getTab().getIndex());
        });
        if (!silent) {
            this.notifyTabAddedListeners(tab);
        }
    }

    addNavigationItem(tab: TabBarItem, silent?: boolean) {
        this.insertNavigationItem(tab, this.tabs.length, silent);
    }

    removeNavigationItem(tab: TabBarItem) {
        let tabIndex = tab.getIndex();

        this.tabs.splice(tabIndex, 1);

        // update indexes for tabs that have been after the removed tab
        for (let i = tabIndex; i < this.tabs.length; i++) {
            this.tabs[i].setIndex(i);
        }

        if (this.isEmpty()) {
            // if there are no tabs than set selected index to negative value
            this.selectedIndex = -1;
        } else if ((this.getSize() - 1) < this.selectedIndex) {
            // if selected index is more than tabs amount set last index as selected
            this.selectedIndex = this.getSize() - 1;
        } else if (tabIndex < this.selectedIndex) {
            // if removed tab was before selected tab than decrement selected index
            this.selectedIndex--;
        }

        tab.remove();

        this.notifyTabRemovedListeners(tabIndex);
    }

    selectNavigationItem(index: number, silent?: boolean, forced?: boolean) {
        // If index is out of borders, do nothing
        if (index < 0 || index >= this.getSize()) {
            return;
        }

        this.notifyTabActivatedListeners(index);

        // Do nothing, if index remain the same and
        if (!forced && this.selectedIndex === index) {
            return;
        }

        this.deselectNavigationItem();
        this.selectedIndex = index;
        let selectedTab = this.getSelectedNavigationItem();
        selectedTab.setActive(true);

        if (!silent && this.scrollEnabled) {
            this.notifyTabSelectedListeners(selectedTab);
        }
    }

    deselectNavigationItem() {
        if (this.selectedIndex !== -1 && this.getSelectedNavigationItem()) {
            this.getSelectedNavigationItem().setActive(false);
        }

        this.selectedIndex = -1;
    }

    getNavigationItem(index: number): TabBarItem {
        return this.tabs[index];
    }

    getSelectedNavigationItem(): TabBarItem {
        return this.tabs[this.selectedIndex];
    }

    getSelectedIndex(): number {
        return this.selectedIndex;
    }

    getSize(): number {
        return this.tabs.length;
    }

    isEmpty(): boolean {
        return this.tabs.length === 0;
    }

    getNavigationItems(): TabBarItem[] {
        return this.tabs;
    }

    onNavigationItemAdded(listener: (event: NavigatorEvent) => void) {
        this.navigationItemAddedListeners.push(listener);
    }

    onNavigationItemRemoved(listener: (index: number) => void) {
        this.navigationItemRemovedListeners.push(listener);
    }

    onNavigationItemSelected(listener: (event: NavigatorEvent) => void) {
        this.navigationItemSelectedListeners.push(listener);
    }

    onNavigationItemDeselected(_listener: (event: NavigatorEvent) => void) {
        //Not used here
    }

    onNavigationItemActivated(listener: (event: ActivatedEvent) => void) {
        this.navigationItemActivatedListeners.push(listener);
    }

    unNavigationItemAdded(listener: (event: NavigatorEvent) => void) {
        this.navigationItemAddedListeners =
            this.navigationItemAddedListeners.filter((currentListener: (event: NavigatorEvent) => void) => {
                return listener !== currentListener;
            });
    }

    unNavigationItemRemoved(listener: (index: number) => void) {
        this.navigationItemRemovedListeners =
            this.navigationItemRemovedListeners.filter((currentListener: (index: number) => void) => {
                return listener !== currentListener;
            });
    }

    unNavigationItemSelected(listener: (event: NavigatorEvent) => void) {
        this.navigationItemSelectedListeners =
            this.navigationItemSelectedListeners.filter((currentListener: (event: NavigatorEvent) => void) => {
                return listener !== currentListener;
            });
    }

    unNavigationItemDeselected(_listener: (event: NavigatorEvent) => void) {
        //Not used here
    }

    unNavigationItemActivated(listener: (event: ActivatedEvent) => void) {
        this.navigationItemActivatedListeners =
            this.navigationItemActivatedListeners.filter((currentListener: (event: ActivatedEvent) => void) => {
                return listener !== currentListener;
            });
    }

    notifyTabAddedListeners(tab: TabBarItem) {
        this.navigationItemAddedListeners.forEach((listener: (event: NavigatorEvent) => void) => {
            listener.call(this, new NavigatorEvent(tab));
        });
    }

    notifyTabRemovedListeners(index: number) {
        this.navigationItemRemovedListeners.forEach((listener: (index: number) => void) => {
            listener.call(this, index);
        });
    }

    private notifyTabSelectedListeners(tab: TabBarItem) {
        this.navigationItemSelectedListeners.forEach((listener: (event: NavigatorEvent) => void) => {
            listener.call(this, new NavigatorEvent(tab));
        });
    }

    private notifyTabActivatedListeners(index: number) {
        this.navigationItemActivatedListeners.forEach((listener: (event: ActivatedEvent) => void) => {
            listener.call(this, new ActivatedEvent(index));
        });
    }
}
