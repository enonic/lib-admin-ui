import Q from 'q';
import {Aggregation} from '../../../aggregation/Aggregation';
import {AggregationContainer} from '../../../aggregation/AggregationContainer';
import {AggregationGroupView} from '../../../aggregation/AggregationGroupView';
import {DefaultErrorHandler} from '../../../DefaultErrorHandler';
import {DivEl} from '../../../dom/DivEl';
import {LabelEl} from '../../../dom/LabelEl';
import {SpanEl} from '../../../dom/SpanEl';
import {ObjectHelper} from '../../../ObjectHelper';
import {SearchInputValues} from '../../../query/SearchInputValues';
import {KeyBinding} from '../../../ui/KeyBinding';
import {KeyBindings} from '../../../ui/KeyBindings';
import {Panel} from '../../../ui/panel/Panel';
import {SearchInput} from '../../../ui2/SearchInput';
import {i18n} from '../../../util/Messages';
import {StringHelper} from '../../../util/StringHelper';

export class BrowseFilterPanel<T>
    extends Panel {

    protected filterPanelRefreshNeeded: boolean = false;
    protected selectionSection: ConstraintSection;
    private searchStartedListeners: (() => void)[] = [];
    private hideFilterPanelButtonClickedListeners: (() => void)[] = [];
    private showResultsButtonClickedListeners: (() => void)[] = [];
    private aggregationContainer: AggregationContainer;
    private newSearchField: SearchInput;
    private hitsCounterEl: SpanEl;
    private showResultsButton: SpanEl;
    private searchContainer: DivEl;
    private refreshStartedListeners: (() => void)[] = [];

    constructor() {
        super();
        this.addClass('filter-panel');

        let showResultsButtonWrapper = new DivEl('show-filter-results');
        this.showResultsButton = new SpanEl('show-filter-results-button');
        this.updateResultsTitle(true);
        this.showResultsButton.onClicked(() => this.notifyShowResultsButtonPressed());
        showResultsButtonWrapper.appendChild(this.showResultsButton);

        this.newSearchField = new SearchInput({
            onChange: (value) => {
                this.search();
            },
            placeholder: i18n('panel.filter.search'),
        });

        this.aggregationContainer = new AggregationContainer();
        this.aggregationContainer.hide();
        this.appendChild(this.aggregationContainer);

        this.getGroupViews()?.forEach((aggregationGroupView: AggregationGroupView) => {
                aggregationGroupView.onBucketViewSelectionChanged(() => {
                    this.search(aggregationGroupView.getName()).catch(DefaultErrorHandler.handle);
                });

                this.aggregationContainer.addAggregationGroupView(aggregationGroupView);
            }
        );

        this.onRendered(() => {
            this.appendExtraSections();
            this.appendChildren(
                this.createSearchContainer(),
                this.createHitsCountContainer(),
                this.aggregationContainer,
                showResultsButtonWrapper
            );

            this.showResultsButton.hide();

            KeyBindings.get().bindKey(new KeyBinding('/', () => {
                window.setTimeout(this.giveFocusToSearch.bind(this), 100);
            }).setGlobal(true));
        });

        this.onHidden(() => {
            this.aggregationContainer.hide();
        });

        this.onShown(() => {
            window.setTimeout(this.aggregationContainer.show.bind(this.aggregationContainer), 100);
            this.refresh();
        });
    }

    protected createSearchContainer(): DivEl {
        this.searchContainer = new DivEl('search-container');
        this.searchContainer.appendChild(this.newSearchField);

        return this.searchContainer;
    }

    protected createHitsCountContainer(): DivEl {
        this.hitsCounterEl = new SpanEl('hits-counter');

        const hitsCounterAndClearButtonWrapper = new DivEl('hits-and-clear');
        hitsCounterAndClearButtonWrapper.appendChild(this.hitsCounterEl);

        return hitsCounterAndClearButtonWrapper;
    }

    setConstraintItems(constraintSection: ConstraintSection, itemsIds: string[]) {
        if (ObjectHelper.anyArrayEquals(itemsIds, constraintSection.getItemsIds())) {
            return;
        }
        constraintSection.setItems(itemsIds);
        if (constraintSection.isActive()) {
            this.resetControls();
            this.search();
            this.addClass('show-constraint');
            window.setTimeout(this.giveFocusToSearch.bind(this), 100);
        }
    }

    setSelectedItems(itemsIds: string[]) {
        this.setConstraintItems(this.selectionSection, itemsIds);
    }

    hasConstraint() {
        return !!this.selectionSection && this.selectionSection.isActive();
    }

    setRefreshOfFilterRequired() {
        this.filterPanelRefreshNeeded = true;
    }

    giveFocusToSearch() {
        this.newSearchField.giveFocus();
    }

    updateAggregations(aggregations: Aggregation[]): void {
        this.aggregationContainer.updateAggregations(aggregations);
    }

    getSearchInputValues(): SearchInputValues {
        const searchInputValues: SearchInputValues = new SearchInputValues();

        searchInputValues.setAggregationSelections(this.aggregationContainer.getSelectedValuesByAggregationName());
        searchInputValues.setTextSearchFieldValue(this.newSearchField.getValue());

        return searchInputValues;
    }

    hasFilterSet(): boolean {
        return this.aggregationContainer.hasSelectedBuckets() || this.hasSearchStringSet();
    }

    hasSearchStringSet(): boolean {
        return !StringHelper.isBlank(this.newSearchField.getValue());
    }

    search(lastChangedAggregation?: string): Q.Promise<void> {
        const hasFilterSet = this.hasFilterSet();

        this.searchContainer.toggleClass('has-filter-set', hasFilterSet);
        this.updateResultsTitle(!hasFilterSet);

        this.notifySearchStarted();
        return this.doSearch(lastChangedAggregation);
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

    resetConstraints(): Q.Promise<void> {
        this.removeClass('show-constraint');
        this.selectionSection.reset();
        return this.reset(true);
    }

    reset(suppressEvent?: boolean): Q.Promise<void> {
        this.resetControls();
        return this.resetFacets(suppressEvent);
    }

    resetControls() {
        this.newSearchField.clear();
        this.aggregationContainer.deselectAll(true);
        this.searchContainer.removeClass('has-filter-set');
        this.updateResultsTitle(true);
    }

    deselectAll() {
        this.aggregationContainer.deselectAll(true);
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

    updateHitsCounter(hits: number, emptyFilterValue: boolean = false) {
        if (!this.hitsCounterEl) {
            return;
        }
        this.hitsCounterEl.whenRendered(() => {
            const unfilteredSelection = (this.hasConstraint() && hits === this.getSelectionItems().length);
            if (emptyFilterValue || unfilteredSelection) {
                this.hitsCounterEl.setHtml(i18n('panel.filter.totalhits', hits));
            } else {
                if (hits !== 1) {
                    this.hitsCounterEl.setHtml(i18n('panel.filter.hits', hits));
                } else {
                    this.hitsCounterEl.setHtml(i18n('panel.filter.hit', hits));
                }
            }
        });

        if (hits !== 0) {
            this.showResultsButton.show();
        } else {
            this.showResultsButton.hide();
        }
    }

    updateResultsTitle(allShown: boolean) {
        const title = allShown ? i18n('panel.filter.showall') : i18n('panel.filter.showresults');
        this.showResultsButton.setHtml(title);
    }

    protected getGroupViews(): AggregationGroupView[] {
        return [];
    }

    protected appendExtraSections() {
        this.appendSelectedItemsSection();
    }

    protected appendSelectedItemsSection() {
        this.selectionSection = this.createConstraintSection();
        this.appendChild(this.selectionSection);
    }

    protected getSelectionItems(): string[] {
        return this.selectionSection.getItemsIds();
    }

    protected createConstraintSection(): ConstraintSection {
        return new ConstraintSection(i18n(
            'panel.filter.selecteditems'));
    }

    protected isFilteredOrConstrained(): boolean {
        return this.hasFilterSet() || this.selectionSection.isActive();
    }

    protected doSearch(lastChangedAggregation?: string): Q.Promise<void> {
        throw new Error('Must be implemented by inheritors');
    }

    protected resetFacets(_suppressEvent?: boolean, _doResetAll?: boolean): Q.Promise<void> {
        throw new Error('To be implemented by inheritors');
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
