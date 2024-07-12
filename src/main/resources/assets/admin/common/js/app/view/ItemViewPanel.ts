import {Panel} from '../../ui/panel/Panel';
import {Closeable} from '../../ui/Closeable';
import {Toolbar, ToolbarConfig} from '../../ui/toolbar/Toolbar';
import {Action} from '../../ui/Action';
import {ItemViewClosedEvent} from './ItemViewClosedEvent';
import {ViewItem} from './ViewItem';

export class ItemViewPanel
    extends Panel
    implements Closeable {

    private toolbar: Toolbar<ToolbarConfig>;

    private panel: Panel;

    private browseItem: ViewItem;

    private closedListeners: ((event: ItemViewClosedEvent) => void)[] = [];

    constructor() {
        super('item-view-panel');
    }

    setToolbar(toolbar: Toolbar<ToolbarConfig>) {
        this.toolbar = toolbar;
        this.appendChild(this.toolbar);
    }

    setPanel(panel: Panel) {
        this.panel = panel;
        this.appendChild(this.panel);
    }

    /*
     As long as the close action is excluded from the toolbar,
     we should add it along with the other toolbar actions to be able to close tabs.
     */
    getActions(): Action[] {
        return [];
    }

    setItem(item: ViewItem) {
        this.browseItem = item;
    }

    getItem(): ViewItem {
        return this.browseItem;
    }

    close(checkCanClose: boolean = false) {
        if (!checkCanClose || this.canClose()) {
            this.notifyClosed();
        }
    }

    canClose(): boolean {
        return true;
    }

    onClosed(listener: (event: ItemViewClosedEvent) => void) {
        this.closedListeners.push(listener);
    }

    unClosed(listener: (event: ItemViewClosedEvent) => void) {
        this.closedListeners = this.closedListeners.filter((currentListener: (event: ItemViewClosedEvent) => void) => {
            return currentListener !== listener;
        });
    }

    private notifyClosed() {
        this.closedListeners.forEach((listener: (event: ItemViewClosedEvent) => void) => {
            listener.call(this, new ItemViewClosedEvent(this));
        });
    }

}
