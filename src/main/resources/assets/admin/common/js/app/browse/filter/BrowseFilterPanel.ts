import Q from 'q';
import {AggregationGroupView} from '../../../aggregation/AggregationGroupView';
import {BucketAggregation} from '../../../aggregation/BucketAggregation';
import {DefaultErrorHandler} from '../../../DefaultErrorHandler';
import {DivEl} from '../../../dom/DivEl';
import {LabelEl} from '../../../dom/LabelEl';
import {ObjectHelper} from '../../../ObjectHelper';
import {SearchInputValues} from '../../../query/SearchInputValues';
import {Panel} from '../../../ui/panel/Panel';
import {BrowseFilterComponent} from '../../../ui2/BrowseFilterComponent';
import {StringHelper} from '../../../util/StringHelper';

export class BrowseFilterPanel<T>
    extends Panel {

    protected filterPanelRefreshNeeded: boolean = false;
    private searchStartedListeners: (() => void)[] = [];
    private hideFilterPanelButtonClickedListeners: (() => void)[] = [];
    private showResultsButtonClickedListeners: (() => void)[] = [];
    private refreshStartedListeners: (() => void)[] = [];
    private filterComponent: BrowseFilterComponent;

    constructor() {
        super('filter-panel');

        this.onShown(() => {
            this.refresh();
        });

        this.filterComponent = new BrowseFilterComponent({
            bucketAggregations: [],
            onChange: () => {
                this.search();
            },
            onSelectionChange: () => {
                this.search();
            },
            filterableAggregations: this.getFilterableAggregations(),
            exportOptions: this.getExportOptions(),
        });

        this.appendChild(this.filterComponent);
    }

    setRefreshOfFilterRequired() {
        this.filterPanelRefreshNeeded = true;
    }

    giveFocusToSearch() {
        this.filterComponent.giveFocus();
    }

    updateAggregations(aggregations: BucketAggregation[]): void {
        this.filterComponent.updateAggregations(aggregations);
    }

    getSearchInputValues(): SearchInputValues {
        const searchInputValues: SearchInputValues = new SearchInputValues();

        searchInputValues.setAggregationSelections(this.filterComponent.getSelectedBuckets());
        searchInputValues.setTextSearchFieldValue(this.filterComponent.getValue());

        return searchInputValues;
    }

    hasFilterSet(): boolean {
        return this.filterComponent.hasSelectedBuckets() || this.hasSearchStringSet();
    }

    hasSearchStringSet(): boolean {
        return !StringHelper.isBlank(this.filterComponent.getValue());
    }

    search(): Q.Promise<void> {
        this.notifySearchStarted();
        return this.doSearch();
    }

    refresh() {
        if (this.filterPanelRefreshNeeded) {
            this.notifyRefreshStarted();
            this.doRefresh();
            this.filterPanelRefreshNeeded = false;
        }
    }

    doRefresh(): Q.Promise<void> {
        return Q<void>(null);
    }

    reset(suppressEvent?: boolean): Q.Promise<void> {
        this.resetControls();
        return this.resetFacets(suppressEvent);
    }

    resetControls() {
        this.filterComponent.reset();
    }

    deselectAll() {
        this.filterComponent.deselectAll(true);
    }

    onSearchStarted(listener: () => void) {
        this.searchStartedListeners.push(listener);
    }

    onRefreshStarted(listener: () => void) {
        this.refreshStartedListeners.push(listener);
    }

    unRefreshStarted(listener: () => void) {
        this.refreshStartedListeners = this.refreshStartedListeners.filter((currentListener: () => void) => {
            return currentListener !== listener;
        });
    }

    unSearchStarted(listener: () => void) {
        this.searchStartedListeners = this.searchStartedListeners.filter((currentListener: () => void) => {
            return currentListener !== listener;
        });
    }

    onHideFilterPanelButtonClicked(listener: () => void) {
        this.hideFilterPanelButtonClickedListeners.push(listener);
    }

    onShowResultsButtonClicked(listener: () => void) {
        this.showResultsButtonClickedListeners.push(listener);
    }

    updateHitsCounter(hits: number) {
        this.filterComponent.updateHitsCounter(hits);
    }

    protected getBucketAggregations(): BucketAggregation[] {
        return [];
    }

    protected isFilteredOrConstrained(): boolean {
        return this.hasFilterSet();
    }

    protected doSearch(): Q.Promise<void> {
        throw new Error('Must be implemented by inheritors');
    }

    protected resetFacets(_suppressEvent?: boolean, _doResetAll?: boolean): Q.Promise<void> {
        throw new Error('To be implemented by inheritors');
    }

    protected getFilterableAggregations(): {
        name: string;
        idsToKeepOnTop?: string[];
    }[] {
        return [];
    }

    getExportOptions(): { label?: string; action: () => void } {
        return null;
    }

    protected notifyRefreshStarted() {
        this.refreshStartedListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }

    private notifySearchStarted() {
        this.searchStartedListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }

    private notifyHidePanelButtonPressed() {
        this.hideFilterPanelButtonClickedListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }

    private notifyShowResultsButtonPressed() {
        this.showResultsButtonClickedListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }
}

export class ConstraintSection
    extends DivEl {

    protected itemsIds: string[];
    private readonly label: LabelEl;

    constructor(label: string) {
        super('constraint-section');

        this.checkVisibilityState();

        this.label = new LabelEl(label);
        this.appendChildren(this.label);
    }

    public reset() {
        this.itemsIds = null;
        this.checkVisibilityState();
    }

    public getItemsIds(): string[] {
        return this.itemsIds;
    }

    public isActive(): boolean {
        return !!this.itemsIds;
    }

    public setItems(items: string[]) {
        this.itemsIds = items;
        this.checkVisibilityState();
    }

    protected setLabel(text: string) {
        this.label.setValue(text);
    }

    private checkVisibilityState() {
        this.setVisible(this.isActive());
    }

}
