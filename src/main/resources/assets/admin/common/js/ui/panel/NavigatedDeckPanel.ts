import {Navigator} from '../Navigator';
import {DeckPanel} from './DeckPanel';
import {NavigatorEvent} from '../NavigatorEvent';
import {NavigationItem} from '../NavigationItem';
import {Panel} from './Panel';

/**
 * A DeckPanel with NavigationItem-s.
 */
export class NavigatedDeckPanel
    extends DeckPanel {

    private navigator: Navigator;

    constructor(navigator: Navigator) {
        super();

        this.navigator = navigator;

        navigator.onNavigationItemSelected((event: NavigatorEvent) => {
            this.showPanelByIndex(event.getItem().getIndex());
        });
    }

    getSelectedNavigationItem(): NavigationItem {
        return this.navigator.getSelectedNavigationItem();
    }

    addNavigablePanel(item: NavigationItem, panel: Panel, select?: boolean): number {
        this.navigator.addNavigationItem(item);
        let index = this.addPanel(panel);
        if (select) {
            this.selectPanelByIndex(index);
        }
        return index;
    }

    removeNavigablePanel(panel: Panel, fallbackSelectIndex?: number): void {
        const panelIndex = this.getPanelIndex(panel);
        const navigationItem = panelIndex >= 0 ? this.navigator.getNavigationItem(panelIndex) : null;

        if (!navigationItem) {
            return;
        }

        const wasSelected = this.getPanelShownIndex() === panelIndex;

        this.navigator.removeNavigationItem(navigationItem);
        this.removePanel(panel);

        const maxIndex = this.getPanels().length - 1;

        if (wasSelected && maxIndex >= 0) {
            const selectIndex = fallbackSelectIndex ?? panelIndex;
            this.selectPanelByIndex(Math.min(Math.max(selectIndex, 0), maxIndex));
        }
    }

    selectPanelByIndex(index: number): void {
        this.navigator.selectNavigationItem(index);
        // panel will be shown because of the selected navigator listener in constructor
    }

}
