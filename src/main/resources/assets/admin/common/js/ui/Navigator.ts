import {NavigationItem} from './NavigationItem';
import {NavigatorEvent} from './NavigatorEvent';

export interface Navigator {

    insertNavigationItem(item: NavigationItem, index: number): void;

    addNavigationItem(item: NavigationItem): void;

    removeNavigationItem(item: NavigationItem): void;

    getNavigationItem(index: number): NavigationItem;

    selectNavigationItem(index: number, silent?: boolean): void;

    getSelectedNavigationItem(): NavigationItem;

    getSelectedIndex(): number;

    deselectNavigationItem(): void;

    getSize(): number;

    getNavigationItems(): NavigationItem[];

    onNavigationItemAdded(listener: (event: NavigatorEvent) => void): void;

    onNavigationItemSelected(listener: (event: NavigatorEvent) => void): void;

    onNavigationItemDeselected(listener: (event: NavigatorEvent) => void): void;

    unNavigationItemAdded(listener: (event: NavigatorEvent) => void): void;

    unNavigationItemSelected(listener: (event: NavigatorEvent) => void): void;

    unNavigationItemDeselected(listener: (event: NavigatorEvent) => void): void;
}
