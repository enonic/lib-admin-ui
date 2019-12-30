import {Element} from '../../dom/Element';
import {Grid} from '../grid/Grid';
import {DataView} from '../grid/DataView';
import {DropdownGrid, DropdownGridConfig} from './DropdownGrid';
import {Option} from './Option';

export class DropdownListGrid<OPTION_DISPLAY_VALUE>
    extends DropdownGrid<OPTION_DISPLAY_VALUE> {

    protected grid: Grid<Option<OPTION_DISPLAY_VALUE>>;

    protected gridData: DataView<Option<OPTION_DISPLAY_VALUE>>;

    constructor(config: DropdownGridConfig<OPTION_DISPLAY_VALUE>) {
        super(config);
    }

    getElement(): Element {
        return this.grid;
    }

    getGrid(): Grid<Option<OPTION_DISPLAY_VALUE>> {
        return this.grid;
    }

    protected initGridAndData() {
        this.gridData = new DataView<Option<OPTION_DISPLAY_VALUE>>();
        if (this.filter) {
            this.gridData.setFilter(this.filter);
        }

        this.grid = new Grid<Option<OPTION_DISPLAY_VALUE>>(this.gridData, this.createColumns(), this.createOptions());

        this.gridData.onRowCountChanged(() => this.notifyRowCountChanged());
    }

    protected getGridData(): DataView<Option<OPTION_DISPLAY_VALUE>> {
        return this.gridData;
    }
}
