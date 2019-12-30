import * as Q from 'q';
import {TabBar} from '../tab/TabBar';
import {TabBarItem, TabBarItemBuilder} from '../tab/TabBarItem';
import {Element} from '../../dom/Element';
import {Panel} from './Panel';
import {NavigatedDeckPanel} from './NavigatedDeckPanel';
import {DeckPanel} from './DeckPanel';

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
