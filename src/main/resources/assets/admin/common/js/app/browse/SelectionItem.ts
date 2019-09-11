import {Equitable} from '../../Equitable';
import {DivEl} from '../../dom/DivEl';
import {Viewer} from '../../ui/Viewer';
import {Element} from '../../dom/Element';
import {BrowseItem} from './BrowseItem';

export class SelectionItem<M extends Equitable>
    extends DivEl {

    protected item: BrowseItem<M>;
    protected removeEl: DivEl;
    private viewer: Viewer<M>;
    private removeListeners: { (event: MouseEvent): void }[] = [];

    private removeTooltip: string;

    constructor(viewer: Viewer<M>, item: BrowseItem<M>) {
        super('browse-selection-item');
        this.viewer = viewer;
        this.item = item;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.removeEl = this.initRemoveButton();
            this.appendChild(this.removeEl);
            this.appendChild(this.viewer);
            return rendered;
        });
    }

    setRemoveButtonTooltip(text: string) {
        if (this.isRendered()) {
            this.removeEl.getEl().setTitle(text);
        } else {
            this.removeTooltip = text;
        }
    }

    onRemoveClicked(listener: (event: MouseEvent) => void) {
        this.removeListeners.push(listener);
    }

    unRemoveClicked(listener: (event: MouseEvent) => void) {
        this.removeListeners = this.removeListeners.filter((current) => {
            return current !== listener;
        });
    }

    notifyRemoveClicked(event: MouseEvent) {
        this.removeListeners.forEach((listener) => {
            listener(event);
        });
    }

    setBrowseItem(item: BrowseItem<M>) {
        this.item = item;
        this.viewer.remove();
        this.viewer.setObject(item.getModel());
        this.appendChild(this.viewer);
    }

    getBrowseItem(): BrowseItem<M> {
        return this.item;
    }

    getViewer(): Viewer<M> {
        return this.viewer;
    }

    hideRemoveButton() {
        if (this.isRendered()) {
            this.removeEl.hide();
        } else {
            this.onRendered(() => {
                this.removeEl.hide();
            });
        }
    }

    getRemoveButton(): Element {
        return this.removeEl;
    }

    private initRemoveButton() {
        let removeEl = new DivEl('icon remove');
        if (this.removeTooltip) {
            removeEl.getEl().setTitle(this.removeTooltip);
        }
        removeEl.onClicked(this.notifyRemoveClicked.bind(this));
        return removeEl;
    }
}
