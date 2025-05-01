import {PropertySet} from '../../../data/PropertySet';
import {i18n} from '../../../util/Messages';
import {DivEl} from '../../../dom/DivEl';
import {FormOptionSet} from './FormOptionSet';
import {FormOptionSetOptionView} from './FormOptionSetOptionView';
import {FormOptionSetOption} from './FormOptionSetOption';
import {FormOptionSetOptionViewer} from './FormOptionSetOptionViewer';
import {Action} from '../../../ui/Action';
import * as Q from 'q';
import {Element} from '../../../dom/Element';
import {FormOptionSetOccurrenceView} from './FormOptionSetOccurrenceView';
import {ListBox} from '../../../ui/selector/list/ListBox';
import {SelectionChange} from '../../../util/SelectionChange';
import {FilterableListBoxWrapper} from '../../../ui/selector/list/FilterableListBoxWrapper';

export class FormOptionSetOccurrenceViewSingleOption
    extends FormOptionSetOccurrenceView {

    private singleSelectionHeader: DivEl;

    private selectionWrapper: FilterableListBoxWrapper<FormOptionSetOption>;

    private singleSelectionDropdown: ListBox<FormOptionSetOption>;

    private resetAction: Action;

    update(dataSet: PropertySet, unchangedOnly?: boolean): Q.Promise<void> {
        return super.update(dataSet, unchangedOnly).then(() => {
            this.layoutSingleSelection();

            return Q(null);
        });
    }

    layout(validate: boolean = true): Q.Promise<void> {
        return super.layout(validate).then(rendered => {
            this.addClass('single-selection');
            this.moreButton.prependMenuActions([this.resetAction]);
            this.layoutSingleSelection();

            return rendered;
        });
    }

    protected initElements() {
        super.initElements();

        this.resetAction = new Action(i18n('action.reset')).setEnabled(false);
        this.singleSelectionHeader = new DivEl('single-selection-header');
        this.singleSelectionDropdown = new FormOptionSetOptionDropdown();
        this.selectionValidationMessage = new DivEl('selection-message');
        this.selectionWrapper = new FilterableListBoxWrapper<FormOptionSetOption>(this.singleSelectionDropdown, {
            className: 'single-selection-dropdown-wrapper',
            filter: this.filter,
        });
    }

    protected postInitElements(): void {
        super.postInitElements();

        this.singleSelectionDropdown.setItems((this.formSet as FormOptionSet).getOptions());
    }

    private layoutSingleSelection() {
        const selectedOptionName: string = this.getSelectedOptionsArray()?.get(0)?.getString();
        const selectedOption = this.singleSelectionDropdown.getItems().find(
            (option: FormOptionSetOption) => option.getName() === selectedOptionName);

        if (selectedOption) {
            // doing this after parent layout to make sure all formItemViews are ready
            this.selectionWrapper.select(selectedOption);
            this.expandSelectedOptionView();
        } else {
            // showing/hiding instead of css to trigger FormSetOccurrences onShow/onHide listeners
            this.formSetOccurrencesContainer.hide();
            this.selectionWrapper.deselectAll();
            this.resetAction.setEnabled(false);
        }
    }

    private hideAllOptionViews(): void {
        this.getFormItemViews().forEach((view: FormOptionSetOptionView) => view.hide());
    }

    protected initListeners() {
        super.initListeners();

        this.resetAction.onExecuted(() => {
            this.selectionWrapper.deselectAll();
            this.singleSelectionDropdown.giveFocus();
        });

        this.selectionWrapper.onSelectionChanged((selectionChange: SelectionChange<FormOptionSetOption>) => {
            if (selectionChange.selected?.length > 0) {
                this.expandSelectedOptionView();
                this.notifyOccurrenceChanged();
            }

            selectionChange.deselected?.forEach((option: FormOptionSetOption) => {
                const idx = this.singleSelectionDropdown.findItemIndex(option);
                const optionView: FormOptionSetOptionView = this.getFormItemViews()[idx] as FormOptionSetOptionView;

                if (optionView) {
                    optionView.disableAndCollapse();
                }

                this.singleSelectionHeader.removeClass('selected');
                this.refresh();
                this.handleSelectionChanged(optionView, false);
            });

        });
    }

    setEnabled(enable: boolean) {
        super.setEnabled(enable);

        this.selectionWrapper.setEnabled(enable);
    }

    refresh() {
        super.refresh();

        this.resetAction.setEnabled(this.selectionWrapper.getSelectedItems().length > 0);
    }

    protected handleSelectionChanged(optionView: FormOptionSetOptionView, isSelected: boolean): void {
        optionView.setVisible(isSelected);
        optionView.setHideErrorsUntilValidityChange(true);
        this.setContainerVisible(this.isContainerExpansionRequired(optionView));
        super.handleSelectionChanged(optionView, isSelected);
    }

    isExpandable(): boolean {
        const selectedOption: FormOptionSetOption = this.selectionWrapper.getSelectedItems()[0];

        if (!selectedOption) {
            return false;
        }

        const idx: number = this.singleSelectionDropdown.findItemIndex(selectedOption);
        const view: FormOptionSetOptionView = this.formItemViews[idx] as FormOptionSetOptionView;
        return view?.isExpandable();
    }

    protected layoutElements() {
        this.singleSelectionHeader.appendChildren<Element>(
            new DivEl('drag-control'), this.selectionWrapper, this.label, this.moreButton
        );
        this.appendChildren(this.singleSelectionHeader, this.selectionValidationMessage, this.formSetOccurrencesContainer);
    }

    private getSelectedOptionView(): FormOptionSetOptionView {
        const selectedOptionName: string = this.selectionWrapper.getSelectedItems()[0]?.getName();
        return this.getFormItemViews()
            .find((view: FormOptionSetOptionView) => view.getFormItem().getName() === selectedOptionName) as FormOptionSetOptionView;
    }

    private expandSelectedOptionView(): void {
        this.hideAllOptionViews();

        const selectedOptionView: FormOptionSetOptionView = this.getSelectedOptionView();

        selectedOptionView?.enableAndExpand();
        this.singleSelectionHeader.addClass('selected');
        this.refresh();
        this.handleSelectionChanged(selectedOptionView, true);
    }

    private isContainerExpansionRequired(optionView: FormOptionSetOptionView): boolean {
        return this.selectionWrapper.getSelectedItems().length > 0 && optionView.getFormItemViews().length > 0;
    }

    private filter(item: FormOptionSetOption, searchString: string): boolean {
        return item.getName()?.toLowerCase().indexOf(searchString.toLowerCase()) > -1 ||
               item.getLabel()?.toLowerCase().indexOf(searchString.toLowerCase()) > -1
               || item.getHelpText()?.toLowerCase().indexOf(searchString.toLowerCase()) > -1;
    }
}

class FormOptionSetOptionDropdown
    extends ListBox<FormOptionSetOption> {

    constructor() {
        super('single-selection-dropdown');
    }

    protected createItemView(item: FormOptionSetOption, readOnly: boolean): FormOptionSetOptionViewer {
        const viewer = new FormOptionSetOptionViewer();
        viewer.setObject(item);
        return viewer;
    }

    protected getItemId(item: FormOptionSetOption): string {
        return item.getName();
    }

}
