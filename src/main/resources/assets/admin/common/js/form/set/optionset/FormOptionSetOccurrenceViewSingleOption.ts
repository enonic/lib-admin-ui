import {PropertySet} from '../../../data/PropertySet';
import {i18n} from '../../../util/Messages';
import {DivEl} from '../../../dom/DivEl';
import {FormOptionSet} from './FormOptionSet';
import {FormOptionSetOptionView} from './FormOptionSetOptionView';
import {FormOptionSetOption} from './FormOptionSetOption';
import {FormOptionSetOptionViewer} from './FormOptionSetOptionViewer';
import {Dropdown} from '../../../ui/selector/dropdown/Dropdown';
import {Option, OptionBuilder} from '../../../ui/selector/Option';
import {Action} from '../../../ui/Action';
import * as Q from 'q';
import {Element} from '../../../dom/Element';
import {FormOptionSetOccurrenceView} from './FormOptionSetOccurrenceView';

export class FormOptionSetOccurrenceViewSingleOption
    extends FormOptionSetOccurrenceView {

    private singleSelectionHeader: DivEl;

    private singleSelectionDropdown: Dropdown<FormOptionSetOption>;

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
        this.singleSelectionDropdown = new Dropdown<FormOptionSetOption>(this.formSet.getName(), {
            optionDisplayValueViewer: new FormOptionSetOptionViewer()
        });

        this.selectionValidationMessage = new DivEl('selection-message');
    }

    protected postInitElements() {
        super.postInitElements();

        this.singleSelectionDropdown.setOptions((this.formSet as FormOptionSet).getOptions()
            .map(fop => new OptionBuilder<FormOptionSetOption>()
                .setValue(fop.getName())    // this is the option ID !
                .setDisplayValue(fop)
                .build()));
    }

    private layoutSingleSelection() {
        const selectedValue: string = this.getSelectedOptionsArray()?.get(0)?.getString();

        if (selectedValue) {
            // doing this after parent layout to make sure all formItemViews are ready
            this.singleSelectionDropdown.setValue(selectedValue, true);
            this.expandSelectedOptionView();
        } else {
            // showing/hiding instead of css to trigger FormSetOccurrences onShow/onHide listeners
            this.formSetOccurrencesContainer.hide();
            this.singleSelectionDropdown.deselectOptions();
            this.resetAction.setEnabled(false);
        }
    }

    private hideAllOptionViews(): void {
        this.getFormItemViews().forEach((view: FormOptionSetOptionView) => view.hide());
    }

    protected initListeners() {
        super.initListeners();

        this.resetAction.onExecuted(() => {
            this.singleSelectionDropdown.deselectOptions();
            this.singleSelectionDropdown.resetActiveSelection();
            this.singleSelectionDropdown.giveFocus();
        });

        this.singleSelectionDropdown.onOptionSelected(() => {
            this.expandSelectedOptionView();
            this.notifyOccurrenceChanged();
        });

        this.singleSelectionDropdown.onOptionDeselected((option: Option<FormOptionSetOption>) => {
            const idx: number = this.singleSelectionDropdown.getOptions().indexOf(option);
            const optionView: FormOptionSetOptionView = this.getFormItemViews()[idx] as FormOptionSetOptionView;

            if (optionView) {
                optionView.disableAndCollapse();
            }

            this.singleSelectionHeader.removeClass('selected');
            this.refresh();
            this.handleSelectionChanged(optionView, false);
        });
    }

    setEnabled(enable: boolean) {
        super.setEnabled(enable);

        this.singleSelectionDropdown.setEnabled(enable);
    }

    refresh() {
        super.refresh();

        this.resetAction.setEnabled(this.singleSelectionDropdown.hasSelectedOption());
    }

    protected handleSelectionChanged(optionView: FormOptionSetOptionView, isSelected: boolean): void {
        optionView.setVisible(isSelected);
        this.setContainerVisible(this.isContainerExpansionRequired(optionView));
        super.handleSelectionChanged(optionView, isSelected);
    }

    isExpandable(): boolean {
        const option: Option<FormOptionSetOption> = this.singleSelectionDropdown?.getSelectedOption();

        if (!option) {
            return false;
        }

        const idx: number = this.singleSelectionDropdown.getOptions().indexOf(option);
        const view: FormOptionSetOptionView = this.formItemViews[idx] as FormOptionSetOptionView;
        return view?.isExpandable();
    }

    protected layoutElements() {
        this.singleSelectionHeader.appendChildren<Element>(
            new DivEl('drag-control'), this.singleSelectionDropdown, this.label, this.moreButton
        );
        this.appendChildren(this.singleSelectionHeader, this.selectionValidationMessage, this.formSetOccurrencesContainer);
    }

    private getSelectedOptionView(): FormOptionSetOptionView {
        const selectedOptionName: string = this.singleSelectionDropdown.getValue();
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
        return this.singleSelectionDropdown.hasSelectedOption()
            && optionView.getFormItemViews().length > 0;
    }
}
