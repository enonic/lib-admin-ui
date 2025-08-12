import Q from 'q';
import {Equitable} from '../../Equitable';
import {DivEl} from '../../dom/DivEl';
import {Element} from '../../dom/Element';
import {Viewer} from '../../ui/Viewer';
import {ViewItem} from '../view/ViewItem';

export class SelectionItem<M extends Equitable>
    extends DivEl {

    protected item: ViewItem;
    protected removeEl: DivEl;
    protected viewer: Viewer<M>;
    private removeListeners: ((event: MouseEvent) => void)[] = [];

    private removeTooltip: string;

    constructor(viewer: Viewer<M>, item: ViewItem) {
        super('browse-selection-item');

        this.viewer = viewer;
        this.item = item;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.removeEl = this.initRemoveButton();
            this.appendChild(this.viewer);
            this.appendChild(this.removeEl);
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

    getBrowseItem(): ViewItem {
        return this.item;
    }

    getViewer(): Viewer<M> {
        return this.viewer;
    }

    hideRemoveButton() {
        this.whenRendered(() => this.removeEl.hide());
    }

    protected initRemoveButton(): Element {
        const removeEl: DivEl = new DivEl('icon remove');

        if (this.removeTooltip) {
            removeEl.getEl().setTitle(this.removeTooltip);
        }

        removeEl.onClicked(this.notifyRemoveClicked.bind(this));

        return removeEl;
    }
}
