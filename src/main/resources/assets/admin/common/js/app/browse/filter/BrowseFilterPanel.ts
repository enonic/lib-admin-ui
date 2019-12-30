import * as Q from 'q';
import {i18n} from '../../../util/Messages';
import {Panel} from '../../../ui/panel/Panel';
import {AggregationContainer} from '../../../aggregation/AggregationContainer';
import {TextSearchField} from './TextSearchField';
import {ClearFilterButton} from './ClearFilterButton';
import {SpanEl} from '../../../dom/SpanEl';
import {DivEl} from '../../../dom/DivEl';
import {AggregationGroupView} from '../../../aggregation/AggregationGroupView';
import {KeyBindings} from '../../../ui/KeyBindings';
import {KeyBinding} from '../../../ui/KeyBinding';
import {ObjectHelper} from '../../../ObjectHelper';
import {Aggregation} from '../../../aggregation/Aggregation';
import {SearchInputValues} from '../../../query/SearchInputValues';
import {LabelEl} from '../../../dom/LabelEl';
import {ActionButton} from '../../../ui/button/ActionButton';
import {Action} from '../../../ui/Action';

export class BrowseFilterPanel<T>
    extends Panel {

    protected filterPanelRefreshNeeded: boolean = false;
    protected selectionSection: ConstraintSection<T>;
    private searchStartedListeners: { (): void }[] = [];
    private hideFilterPanelButtonClickedListeners: { (): void }[] = [];
    private showResultsButtonClickedListeners: { (): void }[] = [];
    private aggregationContainer: AggregationContainer;
    private searchField: TextSearchField;
    private clearFilter: ClearFilterButton;
    private hitsCounterEl: SpanEl;
    private hideFilterPanelButton: SpanEl;
    private showResultsButton: SpanEl;
    private refreshStartedListeners: { (): void }[] = [];

    constructor() {
        super();
        this.addClass('filter-panel');

        this.hideFilterPanelButton = new SpanEl('hide-filter-panel-button icon-search');
        this.hideFilterPanelButton.onClicked(() => this.notifyHidePanelButtonPressed());

        let showResultsButtonWrapper = new DivEl('show-filter-results');
        this.showResultsButton = new SpanEl('show-filter-results-button');
        this.updateResultsTitle(true);
        this.showResultsButton.onClicked(() => this.notifyShowResultsButtonPressed());
        showResultsButtonWrapper.appendChild(this.showResultsButton);

        this.searchField = new TextSearchField(i18n('panel.filter.search'));
        this.searchField.onValueChanged(() => {
            this.search();
        });

        this.clearFilter = new ClearFilterButton();
        this.clearFilter.onClicked(() => this.reset());

        this.hitsCounterEl = new SpanEl('hits-counter');

        let hitsCounterAndClearButtonWrapper = new DivEl('hits-and-clear');
        hitsCounterAndClearButtonWrapper.appendChildren(this.clearFilter, this.hitsCounterEl);

        this.aggregationContainer = new AggregationContainer();
        this.aggregationContainer.hide();
        this.appendChild(this.aggregationContainer);

        let groupViews = this.getGroupViews();
        if (groupViews != null) {
            groupViews.forEach((aggregationGroupView: AggregationGroupView) => {

                    aggregationGroupView.onBucketViewSelectionChanged(() => this.search());

                    this.aggregationContainer.addAggregationGroupView(aggregationGroupView);
                }
            );
        }

        this.onRendered(() => {
            this.appendChild(this.hideFilterPanelButton);
            this.appendExtraSections();
            this.appendChild(this.searchField);
            this.appendChild(hitsCounterAndClearButtonWrapper);
            this.appendChild(this.aggregationContainer);
            this.appendChild(showResultsButtonWrapper);

            this.showResultsButton.hide();

            KeyBindings.get().bindKey(new KeyBinding('/', () => {
                setTimeout(this.giveFocusToSearch.bind(this), 100);
            }).setGlobal(true));
        });

        this.onHidden(() => {
            this.aggregationContainer.hide();
        });

        this.onShown(() => {
            setTimeout(this.aggregationContainer.show.bind(this.aggregationContainer), 100);
            this.refresh();
        });
    }

    setConstraintItems(constraintSection: ConstraintSection<T>, items: T[]) {
        if (ObjectHelper.anyArrayEquals(items, constraintSection.getItems())) {
            return;
        }
        constraintSection.setItems(items);
        if (constraintSection.isActive()) {
            this.resetControls();
            this.search();
            this.addClass('show-constraint');
            setTimeout(this.giveFocusToSearch.bind(this), 100);
        }
    }

    setSelectedItems(items: T[]) {
        this.setConstraintItems(this.selectionSection, items);
    }

    hasConstraint() {
        return !!this.selectionSection && this.selectionSection.isActive();
    }

    setRefreshOfFilterRequired() {
        this.filterPanelRefreshNeeded = true;
    }

    giveFocusToSearch() {
        this.searchField.giveFocus();
    }

    updateAggregations(aggregations: Aggregation[], doUpdateAll?: boolean) {
        this.aggregationContainer.updateAggregations(aggregations, doUpdateAll);
    }

    getSearchInputValues(): SearchInputValues {

        let searchInputValues: SearchInputValues = new SearchInputValues();

        searchInputValues.setAggregationSelections(this.aggregationContainer.getSelectedValuesByAggregationName());
        searchInputValues.setTextSearchFieldValue(this.searchField.getEl().getValue());

        return searchInputValues;
    }

    hasFilterSet(): boolean {
        return this.aggregationContainer.hasSelectedBuckets() || this.hasSearchStringSet();
    }

    hasSearchStringSet(): boolean {
        return this.searchField.getHTMLElement()['value'].trim() !== '';
    }

    search() {
        const hasFilterSet = this.hasFilterSet();

        this.clearFilter.setVisible(hasFilterSet);
        this.updateResultsTitle(!hasFilterSet);

        this.notifySearchStarted();
        this.doSearch();
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
        this.searchField.clear();
        this.aggregationContainer.deselectAll(true);
        this.clearFilter.hide();
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
        let unfilteredSelection = (this.hasConstraint() && hits === this.getSelectionItems().length);
        if (emptyFilterValue || unfilteredSelection) {
            this.hitsCounterEl.setHtml(i18n('panel.filter.totalhits', hits));
        } else {
            if (hits !== 1) {
                this.hitsCounterEl.setHtml(i18n('panel.filter.hits', hits));
            } else {
                this.hitsCounterEl.setHtml(i18n('panel.filter.hit', hits));
            }
        }

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

    protected getSelectionItems(): T[] {
        return this.selectionSection.getItems();
    }

    protected createConstraintSection(): ConstraintSection<T> {
        return new ConstraintSection<T>(i18n(
            'panel.filter.selecteditems'), () => this.onCloseFilterInConstrainedMode());
    }

    protected onCloseFilterInConstrainedMode() {
        this.notifyHidePanelButtonPressed();
    }

    protected isFilteredOrConstrained(): boolean {
        return this.hasFilterSet() || this.selectionSection.isActive();
    }

    protected doSearch(): Q.Promise<void> {
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

export class ConstraintSection<T>
    extends DivEl {

    protected items: T[];
    private label: LabelEl;

    constructor(label: string, closeCallback?: () => void) {
        super('constraint-section');

        this.checkVisibilityState();

        this.label = new LabelEl(label);
        this.appendChildren(this.label);

        if (!!closeCallback) {
            this.appendCloseButton(closeCallback);
        }
    }

    public reset() {
        this.items = null;
        this.checkVisibilityState();
    }

    public getItems(): T[] {
        return this.items;
    }

    public isActive(): boolean {
        return !!this.items;
    }

    public setItems(items: T[]) {

        this.items = items;
        this.checkVisibilityState();
    }

    protected setLabel(text: string) {
        this.label.setValue(text);
    }

    private appendCloseButton(closeCallback: () => void): ActionButton {
        let action = new Action('').onExecuted(() => closeCallback());
        let button = new ActionButton(action);

        button.addClass('btn-close');
        this.appendChild(button);

        return button;
    }

    private checkVisibilityState() {
        this.setVisible(this.isActive());
    }

}
