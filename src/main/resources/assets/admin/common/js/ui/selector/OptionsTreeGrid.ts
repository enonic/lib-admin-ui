import {TreeNode} from '../treegrid/TreeNode';
import {SelectionOnClickType, TreeGrid} from '../treegrid/TreeGrid';
import {TreeGridBuilder} from '../treegrid/TreeGridBuilder';
import {StringHelper} from '../../util/StringHelper';
import {i18n} from '../../util/Messages';
import {GridColumn} from '../grid/GridColumn';
import {GridOptions} from '../grid/GridOptions';
import {Element} from '../../dom/Element';
import {ResponsiveManager} from '../responsive/ResponsiveManager';

export class OptionsTreeGrid<OPTION_DISPLAY_VALUE>
    extends TreeGrid<Option<OPTION_DISPLAY_VALUE>> {

    private loader: OptionDataLoader<OPTION_DISPLAY_VALUE>;

    private treeDataHelper: OptionDataHelper<OPTION_DISPLAY_VALUE>;

    private defaultOption: OPTION_DISPLAY_VALUE;

    private optionsFactory: OptionsFactory<OPTION_DISPLAY_VALUE>;

    private isDefaultOptionActive: boolean;

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
                .prependClasses('dropdown-tree-grid')
                .setRowHeight(50)
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

    removeAllOptions() {
        this.getGrid().getDataView().setItems([]);
    }

    setOptions(options: Option<OPTION_DISPLAY_VALUE>[]) {
        if (this.isTreeModeEnabled()) {
            this.removeAllOptions();
        }
        const data = this.dataToTreeNodes(options, this.getRoot().getCurrentRoot());

        this.getRoot().getCurrentRoot().setChildren(data);
        this.getGrid().getDataView().setItems(data, 'dataId');
    }

    addOption(option: Option<OPTION_DISPLAY_VALUE>) {
        const data = this.dataToTreeNode(option, this.getRoot().getCurrentRoot());

        this.getRoot().getCurrentRoot().addChild(data);
        this.getGrid().getDataView().addItem(data);
    }

    updateOption(option: Option<OPTION_DISPLAY_VALUE>) {
        const data = this.dataToTreeNode(option, this.getRoot().getCurrentRoot());

        this.getRoot().getCurrentRoot().updateChild(data);
        this.getGrid().getDataView().updateItem(this.getDataId(option), data);
    }

    setReadonlyChecker(checker: (optionToCheck: OPTION_DISPLAY_VALUE) => boolean) {
        this.optionsFactory.setReadonlyChecker(checker);
    }

    queryScrollable(): Element {
        let gridClasses = (' ' + this.getGrid().getEl().getClass()).replace(/\s/g, '.');
        let viewport = Element.fromString(gridClasses + ' .slick-viewport', false);
        return viewport;
    }

    reload(parentNodeData?: Option<OPTION_DISPLAY_VALUE>): Q.Promise<void> {
        this.toggleTreeMode(true);
        return super.reload(parentNodeData).then(() => {
            if (this.defaultOption && !this.isDefaultOptionActive) {
                this.scrollToDefaultOption(this.getRoot().getCurrentRoot(), 0);
                this.isDefaultOptionActive = true;
            }
        });
    }

    expandNode(node?: TreeNode<Option<OPTION_DISPLAY_VALUE>>, expandAll?: boolean): Q.Promise<boolean> {
        return super.expandNode(node, expandAll);
    }

    hasChildren(option: Option<OPTION_DISPLAY_VALUE>): boolean {
        return this.treeDataHelper.hasChildren(option.displayValue);
    }

    getDataId(option: Option<OPTION_DISPLAY_VALUE>): string {
        return this.treeDataHelper.getDataId(option.displayValue);
    }

    isEmptyNode(node: TreeNode<Option<OPTION_DISPLAY_VALUE>>): boolean {
        return !(node.getData() && node.getData().displayValue);
    }

    fetch(node: TreeNode<Option<OPTION_DISPLAY_VALUE>>): Q.Promise<Option<OPTION_DISPLAY_VALUE>> {
        return this.loader.fetch(node).then((data: OPTION_DISPLAY_VALUE) => {
            return this.optionsFactory.createOption(data);
        });
    }

    fetchChildren(parentNode?: TreeNode<Option<OPTION_DISPLAY_VALUE>>): Q.Promise<Option<OPTION_DISPLAY_VALUE>[]> {
        parentNode = parentNode ? parentNode : this.getRoot().getCurrentRoot();

        let from = parentNode.getChildren().length;
        if (from > 0 && !parentNode.getChildren()[from - 1].getData().displayValue) {
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

    presetDefaultOption(data: OPTION_DISPLAY_VALUE) {
        this.defaultOption = data;
        this.isDefaultOptionActive = false;
    }

    dataToTreeNode(data: Option<OPTION_DISPLAY_VALUE>, parent: TreeNode<Option<OPTION_DISPLAY_VALUE>>,
                   expandAllowed: boolean = true): TreeNode<Option<OPTION_DISPLAY_VALUE>> {

        const node = super.dataToTreeNode(data, parent, expandAllowed);

        if (StringHelper.isBlank(node.getDataId()) && !node.getData().value) {
            node.setEmptyDataId();
        }

        return node;
    }

    protected handleItemMetadata(row: number) {
        let node = this.getItem(row);
        let cssClasses = '';
        let title = '';

        if (this.isEmptyNode(node)) {
            cssClasses += ' empty-node';
        }

        if (node.getData().readOnly) {
            cssClasses += ' readonly';
            title = i18n('field.readOnly');
        }

        if (node.getData().selectable) {
            cssClasses += ' selectable';
        }

        if (node.getData().expandable) {
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

    private scrollToDefaultOption(parentNode: TreeNode<Option<OPTION_DISPLAY_VALUE>>, startFrom: number) {
        const length = parentNode.getChildren().length;
        const defaultOptionId = this.treeDataHelper.getDataId(this.defaultOption);
        for (let i = startFrom; i < length; i++) {
            const child = parentNode.getChildren()[i];
            const childOption = child.getData().displayValue;
            if (childOption) {
                if (this.treeDataHelper.getDataId(childOption) === defaultOptionId) {
                    this.scrollToRow(this.getGrid().getDataView().getRowById(child.getId()), true); // found target data node
                    return;
                }
                if (this.treeDataHelper.isDescendingPath(this.defaultOption, childOption)) {
                    // found ancestor of target data node
                    this.expandNode(child).then(() => {
                        this.scrollToDefaultOption(child, 0); // expand target data node ancestor and keep searching
                    });
                    return;
                }
            }
        }

        // if reached here  - no matches were found, need to load more children
        this.fetchBatchOfChildren(parentNode);
    }

    private fetchBatchOfChildren(parentNode: TreeNode<Option<OPTION_DISPLAY_VALUE>>) {
        const length = parentNode.getChildren().length;
        const from = parentNode.getChildren()[length - 1].getData().displayValue ? length : length - 1;
        if (from < parentNode.getMaxChildren()) {
            this.fetchChildren(parentNode).then((children: Option<OPTION_DISPLAY_VALUE>[]) => {
                let fetchedChildrenNodes = this.dataToTreeNodes(children, parentNode);
                parentNode.setChildren(fetchedChildrenNodes);
                this.initData(this.getRoot().getCurrentRoot().treeToList());

                this.scrollToDefaultOption(parentNode, from);
            });
        }
    }

    private makeEmptyData(): Option<OPTION_DISPLAY_VALUE> {
        return {
            value: null,
            displayValue: null
        };
    }
}
