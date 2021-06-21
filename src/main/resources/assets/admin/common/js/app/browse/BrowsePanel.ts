import * as Q from 'q';
import {ResponsiveManager} from '../../ui/responsive/ResponsiveManager';
import {ResponsiveRanges} from '../../ui/responsive/ResponsiveRanges';
import {ResponsiveItem} from '../../ui/responsive/ResponsiveItem';
import {ActionButton} from '../../ui/button/ActionButton';
import {TreeGridActions} from '../../ui/treegrid/actions/TreeGridActions';
import {SplitPanel, SplitPanelAlignment, SplitPanelBuilder, SplitPanelUnit} from '../../ui/panel/SplitPanel';
import {Panel} from '../../ui/panel/Panel';
import {Toolbar} from '../../ui/toolbar/Toolbar';
import {TreeGrid} from '../../ui/treegrid/TreeGrid';
import {BrowseFilterPanel} from './filter/BrowseFilterPanel';
import {Action} from '../../ui/Action';
import {DefaultErrorHandler} from '../../DefaultErrorHandler';
import {ToggleFilterPanelAction} from './action/ToggleFilterPanelAction';
import {BrowseItemPanel} from './BrowseItemPanel';
import {i18n} from '../../util/Messages';
import {IDentifiable} from '../../IDentifiable';
import {DataChangedEvent, DataChangedType} from '../../ui/treegrid/DataChangedEvent';
import {ViewItem} from '../view/ViewItem';
import {AppHelper} from '../../util/AppHelper';

export class BrowsePanel
    extends Panel {

    protected browseToolbar: Toolbar;

    protected treeGrid: TreeGrid<ViewItem>;

    protected filterPanel: BrowseFilterPanel<Object>;
    protected filterPanelToBeShownFullScreen: boolean = false;
    protected gridAndItemsSplitPanel: SplitPanel;
    private gridAndToolbarPanel: Panel;
    private browseItemPanel: BrowseItemPanel;
    private filterAndGridSplitPanel: SplitPanel;
    private filterPanelForcedShown: boolean = false;
    private filterPanelForcedHidden: boolean = false;
    private filterPanelIsHiddenByDefault: boolean = true;

    protected toggleFilterPanelAction: Action;

    protected toggleFilterPanelButton: ActionButton;

    private debouncedActionsAndPreviewUpdate: () => void;

    constructor() {
        super();

        this.initElements();
        this.initListeners();
    }

    protected initElements() {
        this.treeGrid = this.createTreeGrid();
        this.filterPanel = this.createFilterPanel();
        this.browseToolbar = this.createToolbar();

        if (!this.browseItemPanel) {
            this.browseItemPanel = this.createBrowseItemPanel();
        }

        this.gridAndItemsSplitPanel = new SplitPanelBuilder(this.treeGrid, this.createBrowseWithItemsPanel())
            .setAlignment(SplitPanelAlignment.VERTICAL)
            .setFirstPanelSize(38, SplitPanelUnit.PERCENT)
            .build();

        if (this.filterPanel) {
            this.gridAndToolbarPanel = new Panel();
            this.filterAndGridSplitPanel = this.setupFilterPanel();
        }

        this.debouncedActionsAndPreviewUpdate = AppHelper.debounce(this.updateActionsAndPreview.bind(this), 100);
    }

    protected initListeners() {
        this.initTreeGridListeners();

        ResponsiveManager.onAvailableSizeChanged(this, (item: ResponsiveItem) => {
            this.checkFilterPanelToBeShownFullScreen(item);

            if (this.isRendered()) {
                if (!this.filterPanelIsHiddenByDefault) { //not relevant if filter panel is hidden by default
                    this.toggleFilterPanelDependingOnScreenSize(item);
                }
                this.togglePreviewPanelDependingOnScreenSize(item);
            }
        });


        if (this.filterPanel) {
            this.onShown(() => {
                if (this.treeGrid.isFiltered()) {
                    this.filterPanel.refresh();
                }
            });
        }
    }

    private initTreeGridListeners() {
        this.treeGrid.onDataChanged(this.handleDataChanged.bind(this));
        this.treeGrid.onSelectionChanged(this.handleSelectionChanged.bind(this));
        this.treeGrid.onHighlightingChanged(this.handleHighlightingChanged.bind(this));

        this.treeGrid.getToolbar().getSelectionPanelToggler().onActiveChanged(isActive => {
            this.treeGrid.toggleClass('selection-mode', isActive);
            this.toggleSelectionMode(isActive);
        });
    }

    private handleSelectionChanged() {
        const totalFullSelected: number = this.treeGrid.getTotalSelected();

        if (this.treeGrid.getToolbar().getSelectionPanelToggler().isActive()) {
            this.updateSelectionModeShownItems(totalFullSelected);
        }

        this.debouncedActionsAndPreviewUpdate();

        if (this.treeGrid.getToolbar().getSelectionPanelToggler().isActive()) {
            this.updateFilterPanelOnSelectionChange();
        }
    }

    private handleDataChanged(event: DataChangedEvent<ViewItem>) {
        this.updateActionsAndPreview();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {

            this.browseToolbar.addClass('browse-toolbar');
            this.gridAndItemsSplitPanel.addClass('content-grid-and-browse-split-panel');

            if (this.filterPanel) {
                this.gridAndToolbarPanel.onAdded(() => {
                    this.gridAndItemsSplitPanel.setDoOffset(true);
                });

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
                        this.gridAndToolbarPanel.appendChild(this.gridAndItemsSplitPanel);
                    });
                });
            } else {
                this.appendChild(this.browseToolbar);
                // Hack: Same hack.
                this.browseToolbar.onRendered(() => {
                    setTimeout(() => {
                        this.appendChild(this.gridAndItemsSplitPanel);
                    });
                });
            }
            return rendered;
        });
    }

    getFilterAndGridSplitPanel(): Panel {
        return this.filterAndGridSplitPanel;
    }

    getTreeGrid(): TreeGrid<ViewItem> {
        return this.treeGrid;
    }

    getBrowseItemPanel(): BrowseItemPanel {
        return this.browseItemPanel;
    }

    getActions(): Action[] {
        return this.browseToolbar.getActions();
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

    protected createToolbar(): Toolbar {
        throw 'Must be implemented by inheritors';
    }

    protected createTreeGrid(): TreeGrid<ViewItem> {
        throw 'Must be implemented by inheritors';
    }

    protected createBrowseItemPanel(): BrowseItemPanel {
        throw 'Must be implemented by inheritors';
    }

    protected getBrowseActions(): TreeGridActions<ViewItem> {
        return this.treeGrid.getContextMenu().getActions();
    }

    protected createFilterPanel(): BrowseFilterPanel<ViewItem> {
        return null;
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

    private handleHighlightingChanged() {
        this.debouncedActionsAndPreviewUpdate();
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
        this.toggleFilterPanelButton.setTitle(i18n('tooltip.filterPanel.show'));
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

    private updateSelectionModeShownItems(totalFullSelected: number) {
        const totalCurrentSelected: number = this.treeGrid.getTotalCurrentSelected();
        const amountOfNodesShown: number = this.treeGrid.getCurrentTotal();

        if (totalCurrentSelected === 0 || amountOfNodesShown === 0) { // all items deselected
            this.treeGrid.getToolbar().getSelectionPanelToggler().setActive(false);
        } else if (amountOfNodesShown > totalFullSelected) { // some item/items deselected
            this.treeGrid.filter(this.treeGrid.getSelectedDataList());
        }
    }

    protected updateActionsAndPreview() {
        this.updateBrowseActions();
        this.updatePreviewItem();
    }

    protected updateBrowseActions(): Q.Promise<void> {
        const actions: TreeGridActions<IDentifiable> = this.getBrowseActions();

        if (actions) {
            return actions.updateActionsEnabledState(this.treeGrid.getSelectedDataList()).catch(DefaultErrorHandler.handle);
        }

        return Q(null);
    }

    protected updatePreviewItem() {
        this.getBrowseItemPanel().togglePreviewForItem(this.treeGrid.getLastSelectedOrHighlightedItem());
    }

    protected createBrowseWithItemsPanel(): Panel {
        return this.browseItemPanel;
    }
}
