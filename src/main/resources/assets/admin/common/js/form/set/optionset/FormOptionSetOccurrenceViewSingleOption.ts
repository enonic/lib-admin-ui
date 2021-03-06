import {PropertySet} from '../../../data/PropertySet';
import {PropertyArray} from '../../../data/PropertyArray';
import {i18n} from '../../../util/Messages';
import {DivEl} from '../../../dom/DivEl';
import {FormOptionSet} from './FormOptionSet';
import {FormSetOccurrenceViewConfig} from '../FormSetOccurrenceView';
import {FormOptionSetOptionView} from './FormOptionSetOptionView';
import {FormOptionSetOption} from './FormOptionSetOption';
import {FormOptionSetOptionViewer} from './FormOptionSetOptionViewer';
import {Dropdown} from '../../../ui/selector/dropdown/Dropdown';
import {Option, OptionBuilder} from '../../../ui/selector/Option';
import {Action} from '../../../ui/Action';
import * as Q from 'q';
import {Element} from '../../../dom/Element';
import {OptionSelectedEvent} from '../../../ui/selector/OptionSelectedEvent';
import {FormOptionSetOccurrenceView} from './FormOptionSetOccurrenceView';

export class FormOptionSetOccurrenceViewSingleOption
    extends FormOptionSetOccurrenceView {

    private singleSelectionHeader: DivEl;

    private singleSelectionDropdown: Dropdown<FormOptionSetOption>;

    private resetAction: Action;

    constructor(config: FormSetOccurrenceViewConfig<FormOptionSetOccurrenceView>) {
        super(config);
    }

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

        this.singleSelectionDropdown.setOptions((<FormOptionSet>this.formSet).getOptions()
            .map(fop => new OptionBuilder<FormOptionSetOption>()
                .setValue(fop.getName())    // this is the option ID !
                .setDisplayValue(fop)
                .build()));
    }

    private layoutSingleSelection() {
        const selectedValue: string = this.getSelectedOptionsArray().get(0)?.getString() ||
                                      (<FormOptionSet>this.formSet).getOptions().find(op => op.isDefaultOption())?.getName();


        if (selectedValue) {
            // doing this after parent layout to make sure all formItemViews are ready
            this.singleSelectionDropdown.setValue(selectedValue);
        } else {
            // showing/hiding instead of css to trigger FormSetOccurrences onShow/onHide listeners
            this.formSetOccurrencesContainer.hide();
            this.singleSelectionDropdown.deselectOptions();
            this.resetAction.setEnabled(false);
        }
    }

    protected initListeners() {
        super.initListeners();

        this.resetAction.onExecuted(() => {
            this.singleSelectionDropdown.deselectOptions();
            this.singleSelectionDropdown.resetActiveSelection();
        });

        this.singleSelectionDropdown.onOptionSelected((event: OptionSelectedEvent<FormOptionSetOption>) => {
            const optionIdx: number = event.getIndex();
            this.getFormItemViews().forEach((view, idx) => view.setVisible(idx === optionIdx));

            const optionView: FormOptionSetOptionView = <FormOptionSetOptionView>this.getFormItemViews()[event.getIndex()];

            if (optionView) {
                optionView.enableAndExpand();
            }

            this.singleSelectionHeader.addClass('selected');
            this.refresh();
            this.handleSelectionChanged(optionView);
            this.notifyOccurrenceChanged();
        });

        this.singleSelectionDropdown.onOptionDeselected((option: Option<FormOptionSetOption>) => {
            const idx: number = this.singleSelectionDropdown.getOptions().indexOf(option);
            const optionView: FormOptionSetOptionView = <FormOptionSetOptionView>this.getFormItemViews()[idx];

            if (optionView) {
                optionView.setSelected(false);
                optionView.disableAndCollapse();
            }

            this.singleSelectionHeader.removeClass('selected');
            this.refresh();
            this.handleSelectionChanged(optionView);
        });
    }

    clean() {
        super.clean();

        const selectedOptionsArray: PropertyArray = this.getSelectedOptionsArray();

        if (!selectedOptionsArray || selectedOptionsArray.isEmpty()) {
            this.propertySet.removeAllProperties();
        }
    }

    setEnabled(enable: boolean) {
        super.setEnabled(enable);

        this.singleSelectionDropdown.setEnabled(enable);
    }

    refresh() {
        super.refresh();

        this.resetAction.setEnabled(this.singleSelectionDropdown.hasSelectedOption());
    }

    protected handleSelectionChanged(optionView: FormOptionSetOptionView) {
        this.formSetOccurrencesContainer.setVisible(
            this.singleSelectionDropdown.hasSelectedOption() && optionView.getFormItemViews().length !== 0);

        super.handleSelectionChanged(optionView);
    }

    isExpandable(): boolean {
        const option: Option<FormOptionSetOption> = this.singleSelectionDropdown?.getSelectedOption();

        if (!option) {
            return false;
        }

        const idx: number = this.singleSelectionDropdown.getOptions().indexOf(option);
        const view: FormOptionSetOptionView = <FormOptionSetOptionView>this.formItemViews[idx];
        return view?.isExpandable();
    }

    protected layoutElements() {
        this.singleSelectionHeader.appendChildren<Element>(new DivEl('drag-control'), this.singleSelectionDropdown, this.label,
            this.moreButton);
        this.appendChild(this.singleSelectionHeader);
        this.appendChild(this.selectionValidationMessage);
    }
}
