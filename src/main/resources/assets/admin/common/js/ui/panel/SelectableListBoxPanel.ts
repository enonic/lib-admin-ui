import {Panel} from './Panel';
import {SelectableListBoxWrapper, SelectionMode} from '../selector/list/SelectableListBoxWrapper';
import {DataChangedEvent} from '../treegrid/DataChangedEvent';
import {SelectionChange} from '../../util/SelectionChange';
import * as Q from 'q';
import {ListBoxToolbar} from '../selector/list/ListBoxToolbar';

export class SelectableListBoxPanel<I> extends Panel {

    protected readonly listBoxWrapper: SelectableListBoxWrapper<I>;

    protected readonly listToolbar: ListBoxToolbar<I>;

    constructor(listBoxWrapper: SelectableListBoxWrapper<I>, toolbar: ListBoxToolbar<I>) {
        super();

        this.listBoxWrapper = listBoxWrapper;
        this.listToolbar = toolbar;
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

    getSelectedItems(): I[] {
        return this.listBoxWrapper.getSelectedItems();
    }

    getLastSelectedItem(): I | undefined {
        return this.listBoxWrapper.getSelectedItems().pop();
    }

    getSelectionMode(): SelectionMode {
        return this.listBoxWrapper.getSelectionMode();
    }

    doRender(): Q.Promise<boolean> {
        this.addClass('selectable-list-box-panel');

        this.appendChildren(this.listToolbar);
        this.appendChildren(this.listBoxWrapper);

        return Q(true);
    }

    getItem(id: string): I {
        return this.listBoxWrapper.getList().getItem(id);
    }

    getToolbar(): ListBoxToolbar<I> {
        return this.listToolbar;
    }

    getTotalItems(): number {
        return this.listBoxWrapper.getTotalItems();
    }
}
