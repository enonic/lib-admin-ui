import {Option} from '../Option';
import {OptionSelectedEvent} from '../OptionSelectedEvent';
import {OptionFilterInputValueChangedEvent} from '../OptionFilterInputValueChangedEvent';
import {DropdownHandle} from '../../button/DropdownHandle';
import {Viewer} from '../../Viewer';
import {DefaultOptionDisplayValueViewer} from '../DefaultOptionDisplayValueViewer';
import {GridColumn} from '../../grid/GridColumn';
import {FormInputEl} from '../../../dom/FormInputEl';
import {ImgEl} from '../../../dom/ImgEl';
import {DropdownExpandedEvent} from '../DropdownExpandedEvent';
import {StyleHelper} from '../../../StyleHelper';
import {FormEl} from '../../../dom/FormEl';
import {AppHelper} from '../../../util/AppHelper';
import {ValueChangedEvent} from '../../../ValueChangedEvent';
import {DropdownOptionFilterInput} from './DropdownOptionFilterInput';
import {DropdownList} from '../DropdownList';
import {DropdownGridConfig} from '../DropdownGrid';
import {DropdownGridRowSelectedEvent} from '../DropdownGridRowSelectedEvent';
import {SelectedOptionView} from './SelectedOptionView';
import {KeyHelper} from '../../KeyHelper';

export interface DropdownConfig<OPTION_DISPLAY_VALUE> {

    iconUrl?: string;

    optionDisplayValueViewer?: Viewer<OPTION_DISPLAY_VALUE>;

    filter?: (item: Option<OPTION_DISPLAY_VALUE>, args: any) => boolean;

    dataIdProperty?: string;

    value?: string;

    disableFilter?: boolean;

    skipExpandOnClick?: boolean;

    inputPlaceholderText?: string;

    noOptionsText?: string;

    createColumns?: GridColumn<OPTION_DISPLAY_VALUE>[];

    listMaxHeight?: number;

    rowHeight?: number;
}

export class Dropdown<OPTION_DISPLAY_VALUE>
    extends FormInputEl {

    private static readonlyClass: string = 'readonly';

    private icon: ImgEl;

    private typeAhead: boolean = true;

    private dropdownHandle: DropdownHandle;

    private input: DropdownOptionFilterInput;

    private dropdownList: DropdownList<OPTION_DISPLAY_VALUE>;

    private optionDisplayValueViewer: Viewer<OPTION_DISPLAY_VALUE>;

    private selectedOptionView: SelectedOptionView<OPTION_DISPLAY_VALUE>;

    private optionSelectedListeners: ((event: OptionSelectedEvent<OPTION_DISPLAY_VALUE>) => void)[] = [];

    private optionDeselectedListeners: ((previousOption: Option<OPTION_DISPLAY_VALUE>) => void)[] = [];

    private optionFilterInputValueChangedListeners: ((event: OptionFilterInputValueChangedEvent) => void)[] = [];

    private expandedListeners: ((event: DropdownExpandedEvent) => void)[] = [];

    private noOptionsText: string;

    constructor(name: string, config: DropdownConfig<OPTION_DISPLAY_VALUE>) {
        super('div', 'dropdown', StyleHelper.COMMON_PREFIX, config.value);
        this.getEl().setAttribute('name', name);

        this.optionDisplayValueViewer = config.optionDisplayValueViewer || new DefaultOptionDisplayValueViewer();

        if (config.iconUrl) {
            this.icon = new ImgEl(config.iconUrl, 'input-icon');
            this.appendChild(this.icon);
        }

        if (config.disableFilter) {
            this.typeAhead = false;
        }

        this.noOptionsText = config.noOptionsText;

        this.input = new DropdownOptionFilterInput(config.inputPlaceholderText);
        this.input.setVisible(this.typeAhead);
        this.appendChild(this.input);

        this.selectedOptionView = new SelectedOptionView<OPTION_DISPLAY_VALUE>(this.optionDisplayValueViewer, config.skipExpandOnClick);
        this.selectedOptionView.hide();
        this.appendChild(this.selectedOptionView);

        this.dropdownHandle = new DropdownHandle();
        this.appendChild(this.dropdownHandle);

        let filter = config.filter || this.defaultFilter;

        this.dropdownList = new DropdownList({
            maxHeight: config.listMaxHeight || 370,
            rowHeight: config.rowHeight || 40,
            width: this.input.getEl().getWidth(),
            optionDisplayValueViewer: config.optionDisplayValueViewer,
            filter: filter,
            dataIdProperty: config.dataIdProperty,
            createColumns: config.createColumns
        } as DropdownGridConfig<OPTION_DISPLAY_VALUE>);
        if (filter) {
            this.dropdownList.setFilterArgs({searchString: ''});
        }

        this.dropdownList.onRowSelection((event: DropdownGridRowSelectedEvent) => {
            this.selectRow(event.getRow());
        });

        this.appendChild(this.dropdownList.getEmptyDropdown());
        this.appendChild(this.dropdownList.getDropdownGrid().getElement());

        this.selectedOptionView.onOpenDropdown(() => {
            this.showDropdown();
            this.giveFocus();
        });

        this.setupListeners();

        this.onRendered(() => this.doUpdateDropdownTopPositionAndWidth());
    }

    clearInput() {
        const oldValue = this.input.getValue();
        this.input.reset();
        this.notifyOptionFilterInputValueChanged(oldValue, '');
        this.dropdownList.setFilterArgs({searchString: ''});
    }

    navigateToSelectedOption() {
        this.dropdownList.navigateToRow(this.getSelectedOption());
    }

    isValid(): boolean {
        return this.input.isValid();
    }

    setEmptyDropdownText(label: string) {
        this.dropdownList.setEmptyDropdownText(label);
    }

    reset() {
        this.input.setValue('');
        this.input.show();
        this.selectedOptionView.hide();
        this.selectedOptionView.resetOption();
    }

    refresh(): void {
        this.dropdownList.getDropdownGrid().invalidate();
    }

    resetActiveSelection() {
        this.dropdownList.resetActiveSelection();
    }

    resetSelected() {
        this.dropdownList.markSelections([]);
    }

    giveFocus(): boolean {
        // If input is hidden or disabled, try dropdown handler.
        return this.input.giveFocus() || this.dropdownHandle.giveFocus();
    }

    isDropdownShown(): boolean {
        return this.dropdownList.isDropdownShown();
    }

    showDropdown() {
        if (this.hasClass(Dropdown.readonlyClass)) {
            return;
        }

        if (this.typeAhead) {
            this.input.show();
            this.selectedOptionView.hide();
        }

        this.doUpdateDropdownTopPositionAndWidth();

        let selectedOption = this.getSelectedOption();

        this.dropdownList.showDropdown(!!selectedOption ? [selectedOption] : null, this.isInputEmpty() ? this.noOptionsText : null);

        this.dropdownHandle.down();

        this.dropdownList.renderDropdownGrid();

        this.notifyExpanded();
    }

    hideDropdown() {
        if (this.selectedOptionView.hasOption()) {
            this.input.hide();
            this.selectedOptionView.show();
        } else if (this.typeAhead) {
            this.input.show();
            this.selectedOptionView.hide();
        }
        this.dropdownHandle.up();
        this.dropdownList.hideDropdown();
    }

    setEnabled(enable: boolean) {
        super.setEnabled(enable);
        this.toggleClass(Dropdown.readonlyClass, !enable);
        this.input.setEnabled(enable);
        this.input.getEl().setDisabled(!enable);
        this.dropdownHandle.setEnabled(enable);
    }

    setOptions(options: Option<OPTION_DISPLAY_VALUE>[]) {
        this.dropdownList.setOptions(options, this.isInputEmpty() ? this.noOptionsText : null);
    }

    sort(comparer: () => void, asc?: boolean) {
        this.dropdownList.sort(comparer, asc);
    }

    removeAllOptions() {
        this.dropdownList.removeAllOptions();
    }

    addOption(option: Option<OPTION_DISPLAY_VALUE>) {
        this.dropdownList.addOption(option);
    }

    removeOption(option: Option<OPTION_DISPLAY_VALUE>) {
        this.dropdownList.removeOption(option);
    }

    hasOptions(): boolean {
        return this.dropdownList.hasOptions();
    }

    getOptionCount(): number {
        return this.dropdownList.getOptionCount();
    }

    getOptions(): Option<OPTION_DISPLAY_VALUE>[] {
        return this.dropdownList.getOptions();
    }

    getOptionByValue(value: string): Option<OPTION_DISPLAY_VALUE> {
        return this.dropdownList.getOptionByValue(value);
    }

    getOptionByRow(rowIndex: number): Option<OPTION_DISPLAY_VALUE> {
        return this.dropdownList.getOptionByRow(rowIndex);
    }

    setValue(value: string, silent?: boolean): Dropdown<OPTION_DISPLAY_VALUE> {
        let option = this.getOptionByValue(value);
        if (option != null) {
            this.selectOption(option, silent);
        }
        return this;
    }

    selectRow(index: number, silent: boolean = false) {
        let option = this.getOptionByRow(index);
        if (option != null) {
            this.selectOption(option, silent);
            if (!silent) {
                FormEl.moveFocusToNextFocusable(this.input);
            }
        }
    }

    selectOption(option: Option<OPTION_DISPLAY_VALUE>, silent: boolean = false) {
        const previousOption: Option<OPTION_DISPLAY_VALUE> = this.getSelectedOption();

        if (!previousOption || previousOption.getValue() !== option.getValue()) {
            this.doSelectOption(option, silent);
        }
    }

    private doSelectOption(option: Option<OPTION_DISPLAY_VALUE>, silent: boolean = false) {
        if (!option.isSelectable()) {
            return;
        }

        const previousOption: Option<OPTION_DISPLAY_VALUE> = this.getSelectedOption();

        this.dropdownList.markSelections([option]);

        this.selectedOptionView.setOption(option);

        if (!silent) {
            this.notifyOptionSelected(option, previousOption);
        }

        this.hideDropdown();
    }

    deselectOptions(silent: boolean = false) {
        const previousOption: Option<OPTION_DISPLAY_VALUE> = this.getSelectedOption();

        this.dropdownList.markSelections([]);
        this.selectedOptionView.resetOption();

        if (previousOption && !silent) {
            this.notifyOptionDeselected(previousOption);
        }

        this.hideDropdown();
    }

    getSelectedOption(): Option<OPTION_DISPLAY_VALUE> {
        return this.selectedOptionView.getOption();
    }

    hasSelectedOption(): boolean {
        return this.selectedOptionView.hasOption();
    }

    getSelectedOptionView(): SelectedOptionView<OPTION_DISPLAY_VALUE> {
        return this.selectedOptionView;
    }

    getValue(): string {
        let selectedOption = this.getSelectedOption();
        if (!selectedOption) {
            return null;
        }
        return selectedOption.getValue();
    }

    setInputIconUrl(iconUrl: string) {
        if (!this.icon) {
            this.icon = new ImgEl();
            this.icon.addClass('input-icon');
            this.icon.insertBeforeEl(this.input);
        }

        this.icon.getEl().setSrc(iconUrl);
    }

    onOptionSelected(listener: (event: OptionSelectedEvent<OPTION_DISPLAY_VALUE>) => void) {
        this.optionSelectedListeners.push(listener);
    }

    unOptionSelected(listener: (event: OptionSelectedEvent<OPTION_DISPLAY_VALUE>) => void) {
        this.optionSelectedListeners.filter((currentListener: (event: OptionSelectedEvent<OPTION_DISPLAY_VALUE>) => void) => {
            return listener !== currentListener;
        });
    }

    onOptionDeselected(listener: (previousOption: Option<OPTION_DISPLAY_VALUE>) => void) {
        this.optionDeselectedListeners.push(listener);
    }

    unOptionDeselected(listener: (previousOption: Option<OPTION_DISPLAY_VALUE>) => void) {
        this.optionDeselectedListeners.filter((currentListener: (previousOption: Option<OPTION_DISPLAY_VALUE>) => void) => {
            return listener !== currentListener;
        });
    }

    private notifyOptionDeselected(previousItem: Option<OPTION_DISPLAY_VALUE>) {
        this.optionDeselectedListeners.forEach((listener: (previousOption: Option<OPTION_DISPLAY_VALUE>) => void) => {
            listener(previousItem);
        });
    }

    onOptionFilterInputValueChanged(listener: (event: OptionFilterInputValueChangedEvent) => void) {
        this.optionFilterInputValueChangedListeners.push(listener);
    }

    unOptionFilterInputValueChanged(listener: (event: OptionFilterInputValueChangedEvent) => void) {
        this.optionFilterInputValueChangedListeners.filter(
            (currentListener: (event: OptionFilterInputValueChangedEvent) => void) => {
                return listener !== currentListener;
            });
    }

    onExpanded(listener: (event: DropdownExpandedEvent) => void) {
        this.expandedListeners.push(listener);
    }

    private defaultFilter(option: Option<OPTION_DISPLAY_VALUE>, args: any) {

        if (!args.searchString) {
            return true;
        }

        const lowerCasedSearchString = args.searchString.toLowerCase();
        if (option.getValue().toLowerCase().indexOf(lowerCasedSearchString) > -1) {
            return true;
        }

        const displayValueAsString = String(option.getDisplayValue());
        if (displayValueAsString?.toLowerCase().indexOf(lowerCasedSearchString) > -1) {
            return true;
        }

        const indices = option.getIndices();
        if (indices?.length) {
            for (const index of indices) {
                if (index?.toLocaleLowerCase().indexOf(lowerCasedSearchString) > -1) {
                    return true;
                }
            }
        }

        return false;
    }

    private doUpdateDropdownTopPositionAndWidth() {
        let inputEl = this.input.getEl();
        this.dropdownList.setTopPx(inputEl.getHeightWithBorder() - inputEl.getBorderBottomWidth());
        this.dropdownList.setWidth(inputEl.getWidthWithBorder());
    }

    private isInputEmpty(): boolean {
        return this.input.getValue() === '';
    }

    private setupListeners() {
        AppHelper.focusInOut(this, () => {
            if (this.isVisible()) {
                this.hideDropdown();
            }
        });

        this.dropdownHandle.onClicked((event) => {
            event.stopPropagation();
            event.preventDefault();

            if (this.isDropdownShown()) {
                this.hideDropdown();
            } else {
                this.showDropdown();
            }
            this.giveFocus();
        });

        this.input.onValueChanged((event: ValueChangedEvent) => {

            this.notifyOptionFilterInputValueChanged(event.getOldValue(), event.getNewValue());

            this.dropdownList.setFilterArgs({searchString: event.getNewValue()});
            this.showDropdown();

            this.dropdownList.navigateToFirstRow();

        });

        this.input.onDblClicked(() => {

            if (!this.isDropdownShown()) {
                this.showDropdown();
            }
        });

        this.input.onClicked(() => {
            this.giveFocus();
        });

        this.input.onKeyDown((event: KeyboardEvent) => {
            if (KeyHelper.isTabKey(event)) { // tab
                this.hideDropdown();
                return;
            }

            if (KeyHelper.isShiftKey(event) || KeyHelper.isControlKey(event) || KeyHelper.isAltKey(event)) {  // shift or ctrl or alt
                return;
            }

            if (!this.isDropdownShown()) {
                if (KeyHelper.isArrowDownKey(event)) { // down
                    this.showDropdown();
                    this.dropdownList.navigateToRowIfNotActive();
                    event.stopPropagation();
                    event.preventDefault();
                }

                return;
            }

            if (KeyHelper.isArrowUpKey(event)) {
                this.dropdownList.navigateToPreviousRow();
            } else if (KeyHelper.isArrowDownKey(event)) {
                this.dropdownList.navigateToNextRow();
            } else if (KeyHelper.isEnterKey(event)) { // enter
                if (this.dropdownList.hasOptions()) {
                    const selectionBefore: Option<OPTION_DISPLAY_VALUE> = this.getSelectedOption();
                    this.selectRow(this.dropdownList.getActiveRow(), false);
                    const selectionAfter: Option<OPTION_DISPLAY_VALUE>  = this.getSelectedOption();
                    this.clearInput();
                    if (selectionBefore === selectionAfter) {
                        this.hideDropdown();
                    }
                }
            } else if (KeyHelper.isEscKey(event)) { // esc
                this.hideDropdown();
            }

            if (KeyHelper.isArrowUpKey(event) || KeyHelper.isArrowDownKey(event) || KeyHelper.isEnterKey(event) ||
                KeyHelper.isEscKey(event)) {
                event.stopPropagation();
                event.preventDefault();
            }

            this.input.giveFocus();
        });
    }

    private notifyOptionSelected(item: Option<OPTION_DISPLAY_VALUE>, previousItem: Option<OPTION_DISPLAY_VALUE>) {
        let event = new OptionSelectedEvent<OPTION_DISPLAY_VALUE>(item, previousItem, this.getOptions().indexOf(item));
        this.optionSelectedListeners.forEach((listener: (event: OptionSelectedEvent<OPTION_DISPLAY_VALUE>) => void) => {
            listener(event);
        });
    }

    private notifyOptionFilterInputValueChanged(oldValue: string, newValue: string) {
        let event = new OptionFilterInputValueChangedEvent(oldValue, newValue);
        this.optionFilterInputValueChangedListeners.forEach(
            (listener: (event: OptionFilterInputValueChangedEvent) => void) => {
                listener(event);
            });
    }

    private notifyExpanded() {
        let event = new DropdownExpandedEvent(this.dropdownList.getDropdownGrid().getElement(), true);
        this.expandedListeners.forEach((listener: (event: DropdownExpandedEvent) => void) => {
            listener(event);
        });
    }

    /* TODO: DEPRECATE METHODS BELOW IN 4.0 */

    disable() {
        console.warn('Dropdown.disable() is deprecated and will be removed in lib-admin-ui 4.0.0');
        this.setEnabled(false);
    }

    enable() {
        console.warn('Dropdown.enable() is deprecated and will be removed in lib-admin-ui 4.0.0');
        this.setEnabled(true);
    }
}
