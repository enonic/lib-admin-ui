import Q from 'q';
import {Element} from '../../dom/Element';
import {TabBar} from '../tab/TabBar';
import {TabBarItem, TabBarItemBuilder} from '../tab/TabBarItem';
import {DeckPanel} from './DeckPanel';
import {NavigatedDeckPanel} from './NavigatedDeckPanel';
import {Panel} from './Panel';

export class DockedPanel
    extends Panel {

    private deck: NavigatedDeckPanel;
    private navigator: TabBar;
    private items: TabBarItem[] = [];

    constructor() {
        super('docked-panel');

        this.navigator = new TabBar();
        this.deck = new NavigatedDeckPanel(this.navigator);

        this.setDoOffset(false);
        this.deck.setDoOffset(false);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {

            this.appendChildren<Element>(this.navigator, this.deck);

            return rendered;
        });
    }

    addItem<T extends Panel>(label: string, addLabelTitleAttribute: boolean, panel: T, select?: boolean): number {
        let item = new TabBarItemBuilder().setLabel(label).setAddLabelTitleAttribute(addLabelTitleAttribute).build();
        this.items.push(item);

        this.deck.addNavigablePanel(item, panel, select || this.items.length === 1);

        return this.deck.getPanelIndex(panel);
    }

    setItemVisible<T extends Panel>(panel: T, visible: boolean): void {
        const currentIndex = this.deck.getPanelIndex(panel);
        if (currentIndex < 0) {
            return;
        }

        // tabs are visible even when panels are hidden
        this.items[currentIndex].toggleClass('hidden', !visible);

        const isCurrentlyVisible = this.deck.getPanelShownIndex() === currentIndex;
        if (isCurrentlyVisible === visible) {
            // either active panel is shown, or non-active is hidden
            // no additional work needed
            return;
        }

        if (isCurrentlyVisible && this.items.length >= 2) {
            // active panel has been hidden, so find a substitute to show
            const indexToShow = this.items.findIndex((item: TabBarItem, i: number) => i !== currentIndex && !item.hasClass('hidden'));
            if (indexToShow >= 0) {
                this.navigator.selectNavigationItem(indexToShow);
            }
        }
    }

    selectPanel<T extends Panel>(panel: T) {
        this.deck.selectPanelByIndex(this.deck.getPanelIndex(panel));
    }

    getNavigator(): TabBar {
        return this.navigator;
    }

    getDeck(): DeckPanel {
        return this.deck;
    }

    getItems(): TabBarItem[] {
        return this.items;
    }

}
