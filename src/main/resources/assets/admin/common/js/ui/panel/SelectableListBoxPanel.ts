import {Panel} from './Panel';
import {SelectableListBoxWrapper} from '../selector/list/SelectableListBoxWrapper';
import {DataChangedEvent} from '../treegrid/DataChangedEvent';
import {SelectionChange} from '../../util/SelectionChange';
import * as Q from 'q';

export class SelectableListBoxPanel<I> extends Panel {

    protected listBoxWrapper: SelectableListBoxWrapper<I>;

    constructor(listBoxWrapper: SelectableListBoxWrapper<I>) {
        super();

        this.listBoxWrapper = listBoxWrapper;
    }

    isFiltered(): boolean {
        return false;
    }

    onDataChanged(listener: (event: DataChangedEvent<I>) => void): void {
        this.listBoxWrapper.onDataChanged(listener);
    }

    onSelectionChanged(listener: (selectionChange: SelectionChange<I>) => void): void {
        this.listBoxWrapper.onSelectionChanged(listener);
    }

    onHighlightChanged(listener: (highlightedItem: I) => void): void {
        // this.listBoxWrapper.onHighlightChanged(listener);
    }

    getSelectedItems(): I[] {
        return this.listBoxWrapper.getSelectedItems();
    }

    doRender(): Q.Promise<boolean> {
        this.appendChild(this.listBoxWrapper);

        return Q(true);
    }

    getItem(id: string): I {
        return this.listBoxWrapper.getItem(id);
    }
}
