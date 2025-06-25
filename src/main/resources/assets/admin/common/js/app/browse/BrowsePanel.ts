import Q from 'q';
import {DefaultErrorHandler} from '../../DefaultErrorHandler';
import {IDentifiable} from '../../IDentifiable';
import {Action} from '../../ui/Action';
import {Panel} from '../../ui/panel/Panel';
import {SelectableListBoxPanel} from '../../ui/panel/SelectableListBoxPanel';
import {SplitPanel, SplitPanelAlignment, SplitPanelBuilder} from '../../ui/panel/SplitPanel';
import {SplitPanelSize} from '../../ui/panel/SplitPanelSize';
import {ResponsiveItem} from '../../ui/responsive/ResponsiveItem';
import {ResponsiveManager} from '../../ui/responsive/ResponsiveManager';
import {ResponsiveRanges} from '../../ui/responsive/ResponsiveRanges';
import {SelectableListBoxKeyNavigator} from '../../ui/selector/list/SelectableListBoxKeyNavigator';
import {Toolbar, ToolbarConfig} from '../../ui/toolbar/Toolbar';
import {TreeGridActions} from '../../ui/treegrid/actions/TreeGridActions';
import {DataChangedEvent} from '../../ui/treegrid/DataChangedEvent';
import {ActionButton} from '../../ui2/ActionButton';
import {AppHelper} from '../../util/AppHelper';
import {i18n} from '../../util/Messages';
import {SelectionChange} from '../../util/SelectionChange';
import {ViewItem} from '../view/ViewItem';
import {ToggleFilterPanelAction} from './action/ToggleFilterPanelAction';
import {BrowseItemPanel} from './BrowseItemPanel';
import {BrowseFilterPanel} from './filter/BrowseFilterPanel';

export class BrowsePanel
    extends Panel {

    protected browseToolbar: Toolbar<ToolbarConfig>;

    protected selectableListBoxPanel: SelectableListBoxPanel<ViewItem>;

    protected filterPanel: BrowseFilterPanel<object>;
    protected treeActions: TreeGridActions<ViewItem>;
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

    protected keyNavigator: SelectableListBoxKeyNavigator<ViewItem>;

    constructor() {
        super();

        this.initElements();
        this.initListeners();
    }

    protected initElements() {
        this.selectableListBoxPanel = this.createListBoxPanel();
        this.keyNavigator = this.createKeyNavigator();
        this.filterPanel = this.createFilterPanel();
        this.browseToolbar = this.createToolbar();

        if (!this.browseItemPanel) {
            this.browseItemPanel = this.createBrowseItemPanel();
        }

        this.gridAndItemsSplitPanel = new SplitPanelBuilder(this.selectableListBoxPanel, this.createBrowseWithItemsPanel())
            .setAlignment(SplitPanelAlignment.VERTICAL)
            .setFirstPanelSize(SplitPanelSize.PERCENTS(this.getFirstPanelSize()))
            .build();

        if (this.filterPanel) {
            this.gridAndToolbarPanel = new Panel();
            this.filterAndGridSplitPanel = this.setupFilterPanel();
        }

        this.selectableListBoxPanel.getWrapper().setSkipFirstClickOnFocus(true);
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
                if (this.selectableListBoxPanel.isFiltered()) {
                    this.filterPanel.refresh();
                }
            });
        }
    }

    protected getFirstPanelSize(): number {
        return 38;
    }

    private initTreeGridListeners() {
        this.selectableListBoxPanel?.onDataChanged(this.handleDataChanged.bind(this));

        let recentlySelected = false;
        let recentlySelectedTimeout = 0;
        // Every selection change fires deselect and select events
        // Use 50ms debounce to prevent handling deselect event
        // Keep debounce time minimal as it affects user perception after selecting single content
        const selectionChangedListener = AppHelper.debounce((selection) => {
            let delayedHandler = true;
            if (!recentlySelected) {
                this.handleTreeListSelectionChanged(selection);
                delayedHandler = false;
            }

            recentlySelected = true;

            if (recentlySelectedTimeout) {
                clearTimeout(recentlySelectedTimeout);
            }
            recentlySelectedTimeout = window.setTimeout(() => {
                recentlySelected = false;
                if (delayedHandler) {
                    this.handleTreeListSelectionChanged(selection);
                }
            }, 250);

        }, 50);

        this.selectableListBoxPanel?.onSelectionChanged(selectionChangedListener);

        if (this.keyNavigator) {
            const upDownHandler = function () {
                // mark recently selected content before selectionChangedListener reads it
                // to prevent loading content when scrolling with keyboard
                if (!recentlySelected) {
                    recentlySelected = true;
                }
                return false;
            }
            this.keyNavigator.onKeyDown(upDownHandler);
            this.keyNavigator.onKeyUp(upDownHandler);
        }

        this.selectableListBoxPanel?.getToolbar().getSelectionPanelToggler().onActiveChanged(isActive => {
            this.toggleSelectionMode(isActive);
        });
    }

    private handleTreeListSelectionChanged(selection: SelectionChange<any>) {

        const totalSelected: number = this.selectableListBoxPanel.getSelectedItems().length;

        if (this.selectableListBoxPanel.getToolbar().getSelectionPanelToggler().isActive()) {
            this.updateTreeListSelectionModeShownItems(totalSelected);
        }

        this.updateActionsAndPreview();

        if (this.selectableListBoxPanel.getToolbar().getSelectionPanelToggler().isActive()) {
            this.updateFilterPanelOnSelectionChange();
        }
    }

    protected updateTreeListSelectionModeShownItems(totalFullSelected: number) {
        const totalCurrentSelected: number = this.selectableListBoxPanel.getSelectedItems().length;
        const amountOfNodesShown: number = this.selectableListBoxPanel.getTotalItems();

        if (totalCurrentSelected === 0 || amountOfNodesShown === 0) { // all items deselected
            this.selectableListBoxPanel.getToolbar().getSelectionPanelToggler().setActive(false);
        } else if (amountOfNodesShown > totalFullSelected) { // some item/items deselected
            this.enableSelectionMode();
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

    getBrowseItemPanel(): BrowseItemPanel {
        return this.browseItemPanel;
    }

    getActions(): Action[] {
        return this.browseToolbar.getActions();
    }

    refreshFilter() {
        if (this.filterPanel && (this.filterPanel.isVisible() || this.selectableListBoxPanel.isFiltered())) {
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
            this.browseToolbar.giveFocus();
        }
    }

    protected updateFilterPanelOnSelectionChange() {
        // TO BE IMPLEMENTED BY INHERITORS
    }

    protected enableSelectionMode() {
        // implement in inheritors
    }

    protected disableSelectionMode() {
        // implement in inheritors
    }

    protected createToolbar(): Toolbar<ToolbarConfig> {
        throw Error('Must be implemented by inheritors');
    }

    protected createListBoxPanel(): SelectableListBoxPanel<ViewItem> {
        throw Error('Must be implemented by inheritors');
    }

    protected createBrowseItemPanel(): BrowseItemPanel {
        throw Error('Must be implemented by inheritors');
    }

    protected getBrowseActions(): TreeGridActions<ViewItem> {
        return this.treeActions;
    }

    protected createFilterPanel(): BrowseFilterPanel<ViewItem> {
        return null;
    }

    protected createKeyNavigator() {
        return new SelectableListBoxKeyNavigator(this.selectableListBoxPanel.getWrapper());
    }

    protected showFilterPanel() {
        this.browseToolbar.giveBlur();
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

    private filterPanelIsHidden(): boolean {
        return this.filterAndGridSplitPanel.isFirstPanelHidden();
    }

    private setupFilterPanel() {
        let splitPanel = new SplitPanelBuilder(this.filterPanel, this.gridAndToolbarPanel)
            .setFirstPanelMinSize(SplitPanelSize.PIXELS(215))
            .setFirstPanelSize(SplitPanelSize.PIXELS(215))
            .setAlignment(SplitPanelAlignment.VERTICAL)
            .setAnimationDelay(100)     // filter panel animation time
            .build();

        this.filterPanel.onHideFilterPanelButtonClicked(() => {
            this.toggleFilterPanel();
        });
        this.filterPanel.onShowResultsButtonClicked(this.toggleFilterPanel.bind(this));

        this.addToggleFilterPanelButtonInToolbar();
        return splitPanel;
    }

    private addToggleFilterPanelButtonInToolbar() {
        this.toggleFilterPanelAction = new ToggleFilterPanelAction(this).setFoldable(false);
        this.toggleFilterPanelAction.setWcagAttributes({
            ariaLabel: i18n('tooltip.filterPanel.show')
        });
        this.toggleFilterPanelButton = this.browseToolbar.addAction(this.toggleFilterPanelAction);
        this.toggleFilterPanelButton.setTitle(i18n('tooltip.filterPanel.show'));
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

    protected togglePreviewPanelDependingOnScreenSize(item: ResponsiveItem) {
        if (item.isInRangeOrSmaller(ResponsiveRanges._540_720) && !this.gridAndItemsSplitPanel.isSecondPanelHidden()) {
            this.gridAndItemsSplitPanel.hideSecondPanel();
        } else if (item.isInRangeOrBigger(ResponsiveRanges._720_960) && this.gridAndItemsSplitPanel.isSecondPanelHidden()) {
            this.gridAndItemsSplitPanel.showSecondPanel();
        }
    }

    protected updateActionsAndPreview() {
        this.updateBrowseActions();
        this.updatePreviewItem();
    }

    protected updateBrowseActions(): Q.Promise<void> {
        const actions: TreeGridActions<IDentifiable> = this.getBrowseActions();

        if (actions) {
            const selectedItems = this.selectableListBoxPanel?.getSelectedItems();
            return actions.updateActionsEnabledState(selectedItems).catch(DefaultErrorHandler.handle);
        }

        return Q(null);
    }

    protected updatePreviewItem() {
        const item = this.selectableListBoxPanel?.getSelectedItems().pop();
        this.getBrowseItemPanel().togglePreviewForItem(item);
    }

    protected createBrowseWithItemsPanel(): Panel {
        return this.browseItemPanel;
    }
}
