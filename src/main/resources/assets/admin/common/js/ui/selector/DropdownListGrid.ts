import {Element} from '../../dom/Element';
import {Grid} from '../grid/Grid';
import {DataView} from '../grid/DataView';
import {DropdownGrid, DropdownGridConfig} from './DropdownGrid';
import {Option} from './Option';
import {i18n} from '../../util/Messages';
import {StringHelper} from '../../util/StringHelper';

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

        this.gridData.setItemMetadataHandler(this.handleItemMetadata.bind(this));

        this.gridData.onRowCountChanged(() => this.notifyRowCountChanged());
    }

    protected getGridData(): DataView<Option<OPTION_DISPLAY_VALUE>> {
        return this.gridData;
    }

    protected handleItemMetadata(row: number) {
        let option = this.gridData.getItem(row);
        let cssClasses = '';
        let title = '';

        if (option.isReadOnly()) {
            cssClasses += ' readonly';
            title = i18n('field.readOnly');
        }

        if (option.isSelectable()) {
            cssClasses += ' selectable';
        }

        if (option.isExpandable()) {
            cssClasses += ' expandable';
        }

        if (!StringHelper.isBlank(cssClasses) || !StringHelper.isBlank(title)) {
            return {cssClasses: cssClasses, title: title};
        }

        return null;
    }
}
