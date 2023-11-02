import * as Q from 'q';
import {TreeNode} from '../treegrid/TreeNode';
import {SelectionOnClickType, TreeGrid} from '../treegrid/TreeGrid';
import {TreeGridBuilder} from '../treegrid/TreeGridBuilder';
import {StringHelper} from '../../util/StringHelper';
import {i18n} from '../../util/Messages';
import {GridColumn} from '../grid/GridColumn';
import {GridOptions} from '../grid/GridOptions';
import {Element} from '../../dom/Element';
import {ResponsiveManager} from '../responsive/ResponsiveManager';
import {OptionDataLoader, OptionDataLoaderData} from './OptionDataLoader';
import {OptionDataHelper} from './OptionDataHelper';
import {OptionsFactory} from './OptionsFactory';
import {Option} from './Option';
import {ElementHelper} from '../../dom/ElementHelper';

export class OptionsTreeGrid<OPTION_DISPLAY_VALUE>
    extends TreeGrid<Option<OPTION_DISPLAY_VALUE>> {

    private loader: OptionDataLoader<OPTION_DISPLAY_VALUE>;

    private treeDataHelper: OptionDataHelper<OPTION_DISPLAY_VALUE>;

    private optionsFactory: OptionsFactory<OPTION_DISPLAY_VALUE>;

    constructor(columns: GridColumn<any>[],
                gridOptions: GridOptions<any>,
                loader: OptionDataLoader<OPTION_DISPLAY_VALUE>,
                treeDataHelper: OptionDataHelper<OPTION_DISPLAY_VALUE>) {

        const builder: TreeGridBuilder<Option<OPTION_DISPLAY_VALUE>> =
            new TreeGridBuilder<Option<OPTION_DISPLAY_VALUE>>()
                .setColumns(columns.slice())
                .setOptions(gridOptions)
                .setPartialLoadEnabled(true)
                .setLoadBufferSize(20)
                .setAutoLoad(false)
                .prependClasses('options-tree-grid')
                .setRowHeight(gridOptions.rowHeight)
                .setHotkeysEnabled(true)
                .setShowToolbar(false)
                .setIdPropertyName(gridOptions.dataIdProperty);

        builder.getOptions().setDataItemColumnValueExtractor(builder.nodeExtractor);

        super(builder);

        this.loader = loader;
        this.treeDataHelper = treeDataHelper;

        this.setSelectionOnClick(SelectionOnClickType.SELECT);

        this.initEventHandlers();
        this.initLoaderListeners();

        this.optionsFactory = new OptionsFactory(this.loader, this.treeDataHelper);

        this.setActive(true);
    }

    protected expandOnClick(elem: ElementHelper, data: Slick.OnClickEventArgs<Option<OPTION_DISPLAY_VALUE>>): void {
        super.expandOnClick(elem, data);

        this.getGrid().resetActiveCell();
    }

    protected collapseOnClick(elem: ElementHelper, data: Slick.OnClickEventArgs<Option<OPTION_DISPLAY_VALUE>>): void {
        super.collapseOnClick(elem, data);

        this.getGrid().resetActiveCell();
    }

    removeAllOptions() {
        this.getGrid().getDataView().setItems([]);
        this.resetExpandedNodesDataIds();
    }

    setOptions(options: Option<OPTION_DISPLAY_VALUE>[]) {
        if (this.isTreeModeEnabled()) {
            this.removeAllOptions();
        }

        const dataItems: TreeNode<Option<OPTION_DISPLAY_VALUE>>[] = this.dataToTreeNodes(options, this.getRoot().getCurrentRoot());

        this.getRoot().getCurrentRoot().setChildren(dataItems);
        this.getGrid().getDataView().setItems(dataItems, 'id');
    }

    addOption(option: Option<OPTION_DISPLAY_VALUE>) {
        const data = this.dataToTreeNode(option, this.getRoot().getCurrentRoot());

        this.getRoot().getCurrentRoot().addChild(data);
        this.getGrid().getDataView().addItem(data);
    }

    updateOption(option: Option<OPTION_DISPLAY_VALUE>) {
        const itemToUpdate: TreeNode<Option<OPTION_DISPLAY_VALUE>> = this.getGrid().getDataView().getItems().find(
            (item: TreeNode<Option<OPTION_DISPLAY_VALUE>>) => {
                return item.getDataId() === option.getValue();
            });

        if (itemToUpdate) {
            itemToUpdate.setData(option);
            this.getGrid().invalidateRows([this.getGrid().getDataView().getRowById(itemToUpdate.getId())]);
        }
    }

    setReadonlyChecker(checker: (optionToCheck: OPTION_DISPLAY_VALUE) => boolean) {
        this.optionsFactory.setReadonlyChecker(checker);
    }

    queryScrollable(): Element {
        const gridClasses = (` ${this.getGrid().getEl().getClass()}`).replace(/\s/g, '.');
        return Element.fromString(`${gridClasses} .slick-viewport`, false);
    }

    reload(): Q.Promise<void> {
        this.toggleTreeMode(true);
        return super.reload();
    }

    hasChildren(option: Option<OPTION_DISPLAY_VALUE>): boolean {
        return this.treeDataHelper.hasChildren(option.getDisplayValue());
    }

    getDataId(option: Option<OPTION_DISPLAY_VALUE>): string {
        return this.treeDataHelper.getDataId(option.getDisplayValue());
    }

    isEmptyNode(node: TreeNode<Option<OPTION_DISPLAY_VALUE>>): boolean {
        return !(node.getData() && node.getData().getDisplayValue());
    }

    fetch(node: TreeNode<Option<OPTION_DISPLAY_VALUE>>): Q.Promise<Option<OPTION_DISPLAY_VALUE>> {
        return this.loader.fetch(node).then((data: OPTION_DISPLAY_VALUE) => {
            return this.optionsFactory.createOption(data);
        });
    }

    fetchChildren(parentNode?: TreeNode<Option<OPTION_DISPLAY_VALUE>>): Q.Promise<Option<OPTION_DISPLAY_VALUE>[]> {
        parentNode = parentNode ? parentNode : this.getRoot().getCurrentRoot();

        let from = parentNode.getChildren().length;
        if (from > 0 && !parentNode.getChildren()[from - 1].getData().getDisplayValue()) {
            parentNode.getChildren().pop();
            from--;
        }

        return this.loader.fetchChildren(parentNode, from, 15).then(
            (loadedData: OptionDataLoaderData<OPTION_DISPLAY_VALUE>) => {
                return this.optionsFactory.createOptions(loadedData.getData()).then((newOptions) => {

                    let options = parentNode.getChildren().map((el) => el.getData()).slice(0, from).concat(newOptions);
                    parentNode.setMaxChildren(loadedData.getTotalHits());

                    if (from + loadedData.getHits() < loadedData.getTotalHits()) {
                        options.push(this.makeEmptyData());
                    }
                    return options;
                });
            });
    }

    protected handleItemMetadata(row: number) {
        let node = this.getItem(row);
        let cssClasses = '';
        let title = '';

        if (this.isEmptyNode(node)) {
            cssClasses += ' empty-node';
        }

        if (node.getData().isReadOnly()) {
            cssClasses += ' readonly';
            title = i18n('field.readOnly');
        }

        if (node.getData().isSelectable()) {
            cssClasses += ' selectable';
        }

        if (node.getData().isExpandable()) {
            cssClasses += ' expandable';
        }

        if (!StringHelper.isBlank(cssClasses) || !StringHelper.isBlank(title)) {
            return {cssClasses: cssClasses, title: title};
        }

        return null;
    }

    private initLoaderListeners() {
        if (this.loader) {
            this.loader.onLoadModeChanged((isTreeMode: boolean) => {
                this.toggleTreeMode(isTreeMode);
            });
        }
    }

    private toggleTreeMode(isTreeMode: boolean) {
        this.toggleClass('tree-mode', isTreeMode);
    }

    private isTreeModeEnabled(): boolean {
        return this.hasClass('tree-mode');
    }

    private initEventHandlers() {
        let onBecameActive = (active: boolean) => {
            if (active) {
                this.getGrid().resizeCanvas();
                this.unActiveChanged(onBecameActive);
            }
        };
        // update columns when grid becomes active for the first time
        this.onActiveChanged(onBecameActive);

        ResponsiveManager.onAvailableSizeChanged(this, () => {
            if (this.isInRenderingView()) {
                this.getGrid().resizeCanvas();
            }
        });
    }

    private makeEmptyData(): Option<OPTION_DISPLAY_VALUE> {
        return Option.create<OPTION_DISPLAY_VALUE>()
            .setValue(null)
            .setDisplayValue(null)
            .build();
    }
}
