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

    addNavigablePanel(item: NavigationItem, panel: Panel, select?: boolean) {
        this.navigator.addNavigationItem(item);
        let index = this.addPanel(panel);
        if (select) {
            this.selectPanelByIndex(index);
        }
        return index;
    }

    selectPanelByIndex(index: number) {
        this.navigator.selectNavigationItem(index);
        // panel will be shown because of the selected navigator listener in constructor
    }

}
