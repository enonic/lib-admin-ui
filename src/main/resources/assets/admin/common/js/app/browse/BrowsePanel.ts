import * as Q from 'q';
import {ResponsiveManager} from '../../ui/responsive/ResponsiveManager';
import {ResponsiveRanges} from '../../ui/responsive/ResponsiveRanges';
import {ResponsiveItem} from '../../ui/responsive/ResponsiveItem';
import {TreeNode} from '../../ui/treegrid/TreeNode';
import {ActionButton} from '../../ui/button/ActionButton';
import {BrowseItem} from './BrowseItem';
import {TreeGridActions} from '../../ui/treegrid/actions/TreeGridActions';
import {SplitPanel, SplitPanelAlignment, SplitPanelBuilder, SplitPanelUnit} from '../../ui/panel/SplitPanel';
import {Equitable} from '../../Equitable';
import {Panel} from '../../ui/panel/Panel';
import {Toolbar} from '../../ui/toolbar/Toolbar';
import {TreeGrid} from '../../ui/treegrid/TreeGrid';
import {BrowseFilterPanel} from './filter/BrowseFilterPanel';
import {Action} from '../../ui/Action';
import {DefaultErrorHandler} from '../../DefaultErrorHandler';
import {AppHelper} from '../../util/AppHelper';
import {ToggleFilterPanelAction} from './action/ToggleFilterPanelAction';
import {BrowseItemPanel} from './BrowseItemPanel';

export class BrowsePanel<M extends Equitable>
    extends Panel {

    protected browseToolbar: Toolbar;

    protected treeGrid: TreeGrid<Object>;

    protected filterPanel: BrowseFilterPanel<Object>;
    protected filterPanelToBeShownFullScreen: boolean = false;
    private gridAndToolbarPanel: Panel;
    private browseItemPanel: BrowseItemPanel<M>;
    private gridAndItemsSplitPanel: SplitPanel;
    private filterAndGridSplitPanel: SplitPanel;
    private filterPanelForcedShown: boolean = false;
    private filterPanelForcedHidden: boolean = false;
    private filterPanelIsHiddenByDefault: boolean = true;

    private toggleFilterPanelAction: Action;

    private toggleFilterPanelButton: ActionButton;

    constructor() {
        super();

        this.treeGrid = this.createTreeGrid();
        this.filterPanel = this.createFilterPanel();
        this.browseToolbar = this.createToolbar();

        const selectionChangedHandler = (currentSelection: TreeNode<Object>[],
                                         fullSelection: TreeNode<Object>[],
                                         highlighted: boolean) => {
            if (this.treeGrid.getToolbar().getSelectionPanelToggler().isActive()) {
                this.updateSelectionModeShownItems(currentSelection, fullSelection);
            }

            let browseItems: BrowseItem<M>[] = this.treeNodesToBrowseItems(fullSelection);
            let changes = this.getBrowseItemPanel().setItems(browseItems);

            if (highlighted && ((fullSelection.length === 0 && changes.getRemoved().length === 1) ||
                                (fullSelection.length === 1 && changes.getAdded().length === 1))) {
                return;
            }

            this.getBrowseActions().updateActionsEnabledState(this.getBrowseItemPanel().getItems(), changes)
                .then(() => {
                    if (this.getBrowseItemPanel().getItems().length > 0 || !highlighted) {
                        this.getBrowseItemPanel().updatePreviewPanel();
                    }
                }).catch(DefaultErrorHandler.handle);

            if (this.treeGrid.getToolbar().getSelectionPanelToggler().isActive() && changes.getRemoved().length > 0) {
                // Redo the search filter panel once items are removed from selection
                this.updateFilterPanelOnSelectionChange();
            }

        };

        this.treeGrid.onDataChanged(() => {
            const noHighlightedNode = !this.treeGrid.hasHighlightedNode();

            // Highlighted nodes updated in a separate listener
            if (noHighlightedNode) {
                this.getBrowseActions().updateActionsEnabledState(this.getBrowseItemPanel().getItems())
                    .then(() => this.getBrowseItemPanel().updatePreviewPanel())
                    .catch(DefaultErrorHandler.handle);
            }

        });

        this.treeGrid.onSelectionChanged(selectionChangedHandler);

        const highlightingChangedDebouncedHandler = AppHelper.debounceWithInterrupt(
            (node: TreeNode<Object>, callback?: Function) => {
                this.onHighlightingChanged(node).then(() => {
                    if (callback) {
                        callback();
                    }
                });
            }, 200);

        let highlightingChangedHandler = (highlightedNode: TreeNode<Object>, force: boolean, callback: Function) => {
            highlightingChangedDebouncedHandler([highlightedNode, callback], force);
        };

        this.treeGrid.onHighlightingChanged(highlightingChangedHandler);

        ResponsiveManager.onAvailableSizeChanged(this, (item: ResponsiveItem) => {
            this.checkFilterPanelToBeShownFullScreen(item);

            if (this.isRendered()) {
                if (!this.filterPanelIsHiddenByDefault) { //not relevant if filter panel is hidden by default
                    this.toggleFilterPanelDependingOnScreenSize(item);
                }
                this.togglePreviewPanelDependingOnScreenSize(item);
            }
        });

        this.treeGrid.getToolbar().getSelectionPanelToggler().onActiveChanged(isActive => {
            this.treeGrid.toggleClass('selection-mode', isActive);
            this.toggleSelectionMode(isActive);
        });

        this.onShown(() => {
            if (this.treeGrid.isFiltered()) {
                this.filterPanel.refresh();
            }
        });

    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            if (!this.browseItemPanel) {
                this.browseItemPanel = this.createBrowseItemPanel();
            }
            this.gridAndItemsSplitPanel = new SplitPanelBuilder(this.treeGrid, this.browseItemPanel)
                .setAlignment(SplitPanelAlignment.VERTICAL)
                .setFirstPanelSize(38, SplitPanelUnit.PERCENT)
                .build();
            const mainContentSplitPanel = this.createMainContentSplitPanel(this.gridAndItemsSplitPanel);

            this.browseToolbar.addClass('browse-toolbar');
            this.gridAndItemsSplitPanel.addClass('content-grid-and-browse-split-panel');

            if (this.filterPanel) {
                this.gridAndToolbarPanel = new Panel();

                this.gridAndToolbarPanel.onAdded(() => {
                    this.gridAndItemsSplitPanel.setDoOffset(true);
                });

                this.filterAndGridSplitPanel = this.setupFilterPanel();
                if (this.filterPanelIsHiddenByDefault) {
                    this.hideFilterPanel();
                }
                this.appendChild(this.filterAndGridSplitPanel);

                // Hack: Places the append calls farther in the engine call stack.
                // Prevent toolbar and gridPanel not being visible when the width/height
                // is requested and elements resize/change position/etc.
                setTimeout(() => {
                    this.gridAndToolbarPanel.appendChild(this.browseToolbar);
                });
                this.browseToolbar.onRendered(() => {
                    setTimeout(() => {
                        this.gridAndToolbarPanel.appendChild(mainContentSplitPanel);
                    });
                });
            } else {
                this.appendChild(this.browseToolbar);
                // Hack: Same hack.
                this.browseToolbar.onRendered(() => {
                    setTimeout(() => {
                        this.appendChild(mainContentSplitPanel);
                    });
                });
            }
            return rendered;
        });
    }

    getFilterAndGridSplitPanel(): Panel {
        return this.filterAndGridSplitPanel;
    }

    getTreeGrid(): TreeGrid<Object> {
        return this.treeGrid;
    }

    getBrowseItemPanel(): BrowseItemPanel<M> {
        return this.browseItemPanel;
    }

    getActions(): Action[] {
        return this.browseToolbar.getActions();
    }

    treeNodeToBrowseItem(_node: TreeNode<Object>): BrowseItem<M> | null {
        throw new Error('Must be implemented by inheritors');
    }

    treeNodesToBrowseItems(_nodes: TreeNode<Object>[]): BrowseItem<M>[] {
        throw new Error('Must be implemented by inheritors');
    }

    refreshFilter() {
        if (this.filterPanel && (this.filterPanel.isVisible() || this.treeGrid.isFiltered())) {
            this.filterPanel.refresh();
        }
    }

    setRefreshOfFilterRequired() {
        if (this.filterPanel) {
            this.filterPanel.setRefreshOfFilterRequired();
        }
    }

    toggleFilterPanel() {
        this.filterAndGridSplitPanel.setFirstPanelIsFullScreen(this.filterPanelToBeShownFullScreen);

        if (this.filterPanelIsHidden()) {
            this.showFilterPanel();
        } else {
            this.hideFilterPanel();
        }
    }

    protected updateFilterPanelOnSelectionChange() {
        // TO BE IMPLEMENTED BY INHERITORS
    }

    protected enableSelectionMode() {
        this.treeGrid.filter(this.treeGrid.getSelectedDataList());
    }

    protected disableSelectionMode() {
        this.treeGrid.resetFilter();
    }

    protected checkIfItemIsRenderable(_browseItem: BrowseItem<M>): Q.Promise<boolean> {
        let deferred = Q.defer<boolean>();
        deferred.resolve(true);
        return deferred.promise;
    }

    protected createToolbar(): Toolbar {
        throw 'Must be implemented by inheritors';
    }

    protected createTreeGrid(): TreeGrid<Object> {
        throw 'Must be implemented by inheritors';
    }

    protected createBrowseItemPanel(): BrowseItemPanel<M> {
        throw 'Must be implemented by inheritors';
    }

    protected getBrowseActions(): TreeGridActions<M> {
        return this.treeGrid.getContextMenu().getActions();
    }

    protected createFilterPanel(): BrowseFilterPanel<M> {
        return null;
    }

    protected createMainContentSplitPanel(gridAndItemsSplitPanel: SplitPanel): SplitPanel {
        return gridAndItemsSplitPanel;
    }

    protected showFilterPanel() {
        this.filterPanelForcedShown = true;
        this.filterPanelForcedHidden = false;

        if (this.filterPanelToBeShownFullScreen) {
            this.filterAndGridSplitPanel.hideSecondPanel();
        }

        this.filterAndGridSplitPanel.showFirstPanel();
        this.filterPanel.giveFocusToSearch();
        this.toggleFilterPanelAction.setVisible(false);
        this.toggleFilterPanelButton.removeClass('filtered');
    }

    protected hideFilterPanel() {
        this.filterPanelForcedShown = false;
        this.filterPanelForcedHidden = true;
        this.filterAndGridSplitPanel.showSecondPanel();
        this.filterAndGridSplitPanel.hideFirstPanel();

        this.toggleFilterPanelAction.setVisible(true);
        if (this.filterPanel.hasFilterSet()) {
            this.toggleFilterPanelButton.addClass('filtered');
        }

    }

    private toggleSelectionMode(isActive: boolean) {
        if (isActive) {
            this.enableSelectionMode();
        } else {
            this.disableSelectionMode();
        }
    }

    private onHighlightingChanged(node: TreeNode<Object>): Q.Promise<any> {
        if (!node) {
            if (this.treeGrid.getSelectedDataList().length === 0) {
                this.getBrowseItemPanel().togglePreviewForItem();
                return this.getBrowseActions().updateActionsEnabledState([]);
            }

            return Q(null);
        }

        const browseItem: BrowseItem<M> = this.treeNodeToBrowseItem(node);
        const updateActionsPromise = this.getBrowseActions().updateActionsEnabledState([browseItem]);
        const togglePreviewPromise = this.checkIfItemIsRenderable(browseItem).then(() => {
            this.getBrowseItemPanel().togglePreviewForItem(browseItem);
        });

        return Q.all([updateActionsPromise, togglePreviewPromise]);
    }

    private filterPanelIsHidden(): boolean {
        return this.filterAndGridSplitPanel.isFirstPanelHidden();
    }

    private setupFilterPanel() {
        let splitPanel = new SplitPanelBuilder(this.filterPanel, this.gridAndToolbarPanel)
            .setFirstPanelMinSize(215, SplitPanelUnit.PIXEL)
            .setFirstPanelSize(215, SplitPanelUnit.PIXEL)
            .setAlignment(SplitPanelAlignment.VERTICAL)
            .setAnimationDelay(100)     // filter panel animation time
            .build();

        this.filterPanel.onHideFilterPanelButtonClicked(this.toggleFilterPanel.bind(this));
        this.filterPanel.onShowResultsButtonClicked(this.toggleFilterPanel.bind(this));

        this.addToggleFilterPanelButtonInToolbar();
        return splitPanel;
    }

    private addToggleFilterPanelButtonInToolbar() {
        this.toggleFilterPanelAction = new ToggleFilterPanelAction(this);
        this.toggleFilterPanelButton = new ActionButton(this.toggleFilterPanelAction);
        this.browseToolbar.prependChild(this.toggleFilterPanelButton);
        this.toggleFilterPanelAction.setVisible(false);
    }

    private checkFilterPanelToBeShownFullScreen(item: ResponsiveItem) {
        this.filterPanelToBeShownFullScreen = item.isInRangeOrSmaller(ResponsiveRanges._360_540);
    }

    private toggleFilterPanelDependingOnScreenSize(item: ResponsiveItem) {
        if (item.isInRangeOrSmaller(ResponsiveRanges._1380_1620)) {
            if (this.filterPanel && !this.filterAndGridSplitPanel.isFirstPanelHidden() && !this.filterPanelForcedShown) {
                this.filterAndGridSplitPanel.hideFirstPanel();
                this.toggleFilterPanelAction.setVisible(true);
            }
        } else if (item.isInRangeOrBigger(ResponsiveRanges._1620_1920)) {
            if (this.filterPanel && this.filterAndGridSplitPanel.isFirstPanelHidden() && !this.filterPanelForcedHidden) {
                this.filterAndGridSplitPanel.showFirstPanel();
                this.toggleFilterPanelAction.setVisible(false);
            }
        }
    }

    private togglePreviewPanelDependingOnScreenSize(item: ResponsiveItem) {
        if (item.isInRangeOrSmaller(ResponsiveRanges._540_720) && !this.gridAndItemsSplitPanel.isSecondPanelHidden()) {
            this.gridAndItemsSplitPanel.hideSecondPanel();
        } else if (item.isInRangeOrBigger(ResponsiveRanges._720_960) && this.gridAndItemsSplitPanel.isSecondPanelHidden()) {
            this.gridAndItemsSplitPanel.showSecondPanel();
        }
    }

    private updateSelectionModeShownItems(currentSelection: TreeNode<Object>[], fullSelection: TreeNode<Object>[]) {
        if (currentSelection.length === fullSelection.length) { // to filter unwanted selection change events
            let amountOfNodesShown: number = this.treeGrid.getRoot().getCurrentRoot().treeToList().length;
            if (currentSelection.length === 0 || amountOfNodesShown === 0) { // all items deselected
                this.treeGrid.getToolbar().getSelectionPanelToggler().setActive(false);
            } else if (amountOfNodesShown > fullSelection.length) { // some item/items deselected
                this.treeGrid.filter(this.treeGrid.getSelectedDataList());
            }
        }
    }

}
