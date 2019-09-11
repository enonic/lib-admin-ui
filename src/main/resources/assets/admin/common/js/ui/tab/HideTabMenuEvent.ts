import {Event} from '../../event/Event';
import {ClassHelper} from '../../ClassHelper';

export class HideTabMenuEvent
    extends Event {

    tabMenu: TabMenu;

    constructor(tabMenu: TabMenu) {
        super();
        this.tabMenu = tabMenu;
    }

    static on(handler: (event: HideTabMenuEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: HideTabMenuEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

    getTabMenu(): TabMenu {
        return this.tabMenu;
    }

}
