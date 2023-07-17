import * as Q from 'q';
import {Option} from '../Option';
import {OptionFilterInputValueChangedEvent} from '../OptionFilterInputValueChangedEvent';
import {DropdownHandle} from '../../button/DropdownHandle';
import {Viewer} from '../../Viewer';
import {DelayedFunctionCall} from '../../../util/DelayedFunctionCall';
import {Button} from '../../button/Button';
import {ElementHelper} from '../../../dom/ElementHelper';
import {Body} from '../../../dom/Body';
import {WindowDOM} from '../../../dom/WindowDOM';
import {GridColumn} from '../../grid/GridColumn';
import {i18n} from '../../../util/Messages';
import {KeyEventsHandler} from '../../../event/KeyEventsHandler';
import {BrowserHelper} from '../../../BrowserHelper';
import {FormInputEl} from '../../../dom/FormInputEl';
import {ImgEl} from '../../../dom/ImgEl';
import {ValueChangedEvent} from '../../../ValueChangedEvent';
import {DropdownExpandedEvent} from '../DropdownExpandedEvent';
import {StyleHelper} from '../../../StyleHelper';
import {ObjectHelper} from '../../../ObjectHelper';
import {StringHelper} from '../../../util/StringHelper';
import {FormEl} from '../../../dom/FormEl';
import {AppHelper} from '../../../util/AppHelper';
import {DefaultErrorHandler} from '../../../DefaultErrorHandler';
import {Element} from '../../../dom/Element';
import {SelectedOptionsView} from './SelectedOptionsView';
import {OptionDataLoader} from '../OptionDataLoader';
import {OptionDataHelper} from '../OptionDataHelper';
import {ComboBoxOptionFilterInput} from './ComboBoxOptionFilterInput';
import {ComboBoxDropdown} from './ComboBoxDropdown';
import {DropdownGrid, DropdownGridConfig} from '../DropdownGrid';
import {assert, assertNotNull} from '../../../util/Assert';
import {SelectedOption} from './SelectedOption';
import {BaseSelectedOptionsView} from './BaseSelectedOptionsView';
import {SelectedOptionEvent} from './SelectedOptionEvent';
import {DropdownGridRowSelectedEvent} from '../DropdownGridRowSelectedEvent';
import {KeyHelper} from '../../KeyHelper';

export interface ComboBoxConfig<T> {

    iconUrl?: string;

    optionDisplayValueViewer?: Viewer<T>;

    selectedOptionsView: SelectedOptionsView<T>;

    maximumOccurrences?: number;

    filter?: (item: Option<T>, args: unknown) => boolean;

    hideComboBoxWhenMaxReached?: boolean;

    setNextInputFocusWhenMaxReached?: boolean;

    dataIdProperty?: string;

    delayedInputValueChangedHandling?: number;

    minWidth?: number;

    maxHeight?: number;

    rowHeight?: number;

    value?: string;

    noOptionsText?: string;

    displayMissingSelectedOptions?: boolean;

    removeMissingSelectedOptions?: boolean;

    skipAutoDropShowOnValueChange?: boolean;

    treegridDropdownAllowed?: boolean;

    optionDataHelper?: OptionDataHelper<T>;

    optionDataLoader?: OptionDataLoader<T>;

    onDropdownShownCallback?: () => Q.Promise<void>;

    requestMissingOptions?: (missingOptionIds: string[]) => Q.Promise<Object>;

    createColumns?: GridColumn<T>[];
}

export enum PositionType {
    BELOW,
    ABOVE,
    FLEXIBLE_BELOW,
    FLEXIBLE_ABOVE
}

export interface DropdownPosition {

    position: PositionType;

    height: number;
}

export class ComboBox<OPTION_DISPLAY_VALUE>
    extends FormInputEl {

    public static debug: boolean = false;
    static VALUE_SEPARATOR: string = ';';
    private icon: ImgEl;
    private dropdownHandle: DropdownHandle;
    private applySelectionsButton: Button;
    private input: ComboBoxOptionFilterInput;
    private delayedInputValueChangedHandling: number;
    private delayedHandleInputValueChangedFnCall: DelayedFunctionCall;
    private preservedInputValueChangedEvent: ValueChangedEvent;
    private selectedOptionsView: SelectedOptionsView<OPTION_DISPLAY_VALUE>;
    private comboBoxDropdown: ComboBoxDropdown<OPTION_DISPLAY_VALUE>;
    private hideComboBoxWhenMaxReached: boolean;
    private setNextInputFocusWhenMaxReached: boolean = true;
    private ignoreNextFocus: boolean = false;
    private minWidth: number = -1;
    private optionFilterInputValueChangedListeners: ((event: OptionFilterInputValueChangedEvent) => void)[] = [];
    private expandedListeners: ((event: DropdownExpandedEvent) => void)[] = [];
    private valueLoadedListeners: ((options: Option<OPTION_DISPLAY_VALUE>[]) => void)[] = [];
    private contentMissingListeners: ((ids: string[]) => void)[] = [];
    private noOptionsText: string;
    private displayMissingSelectedOptions: boolean = false;
    private removeMissingSelectedOptions: boolean = false;
    private skipAutoDropShowOnValueChange: boolean = false;
    private onDropdownShownCallback: () => Q.Promise<void>;
    private requestMissingOptions: (missingOptionIds: string[]) => Q.Promise<Object>;
    private keyEventsHandler: KeyEventsHandler;
    private optionsToSelect: Map<string, Option<OPTION_DISPLAY_VALUE>> = new Map<string, Option<OPTION_DISPLAY_VALUE>>();
    private optionsToUnselect: Map<string, Option<OPTION_DISPLAY_VALUE>> = new Map<string, Option<OPTION_DISPLAY_VALUE>>();
    private static EXPANDED_CLASS: string = 'expanded';

    constructor(name: string, config: ComboBoxConfig<OPTION_DISPLAY_VALUE>) {
        super('div', 'combobox', StyleHelper.COMMON_PREFIX, config.value);
        this.getEl().setAttribute('name', name);

        this.hideComboBoxWhenMaxReached = config.hideComboBoxWhenMaxReached;
        if (config.setNextInputFocusWhenMaxReached != null) {
            this.setNextInputFocusWhenMaxReached = config.setNextInputFocusWhenMaxReached;
        }
        if (config.selectedOptionsView != null) {
            this.selectedOptionsView = config.selectedOptionsView;
            this.selectedOptionsView.setMaximumOccurrences(config.maximumOccurrences != null ? config.maximumOccurrences : 0);
        }
        if (config.iconUrl) {
            this.icon = new ImgEl(config.iconUrl, 'input-icon');
            this.appendChild(this.icon);
        }

        if (config.minWidth) {
            this.minWidth = config.minWidth;
        }

        if (config.displayMissingSelectedOptions) {
            this.displayMissingSelectedOptions = config.displayMissingSelectedOptions;
        }

        if (config.removeMissingSelectedOptions) {
            this.removeMissingSelectedOptions = config.removeMissingSelectedOptions;
        }

        if (config.skipAutoDropShowOnValueChange) {
            this.skipAutoDropShowOnValueChange = config.skipAutoDropShowOnValueChange;
        }

        this.onDropdownShownCallback = config.onDropdownShownCallback;
        if (!config.onDropdownShownCallback) {
            this.onDropdownShownCallback = () => Q(null);
        }

        this.requestMissingOptions = config.requestMissingOptions || (() => Q({}));

        this.noOptionsText = config.noOptionsText;

        this.input = new ComboBoxOptionFilterInput();
        this.appendChild(this.input);

        this.delayedInputValueChangedHandling = config.delayedInputValueChangedHandling || 0;
        this.delayedHandleInputValueChangedFnCall = new DelayedFunctionCall(this.handleInputValueChanged, this,
            this.delayedInputValueChangedHandling);

        this.dropdownHandle = new DropdownHandle();
        this.appendChild(this.dropdownHandle);

        if (this.selectedOptionsView && (config.maximumOccurrences !== 1)) {
            this.applySelectionsButton = new Button(i18n('action.apply'));
            this.applySelectionsButton.addClass('small apply-button');
            this.applySelectionsButton.hide();
            this.appendChild(this.applySelectionsButton);
        }

        this.comboBoxDropdown = new ComboBoxDropdown({
            maxHeight: config.maxHeight || 370,
            rowHeight: config.rowHeight || 40,
            width: this.input.getWidth(),
            optionDisplayValueViewer: config.optionDisplayValueViewer,
            filter: config.filter,
            dataIdProperty: config.dataIdProperty,
            multipleSelections: (this.selectedOptionsView && (config.maximumOccurrences !== 1)),
            treegridDropdownAllowed: config.treegridDropdownAllowed,
            optionDataHelper: config.optionDataHelper,
            optionDataLoader: config.optionDataLoader,
            createColumns: config.createColumns
        } as DropdownGridConfig<OPTION_DISPLAY_VALUE>);
        this.initDropdown();
        this.setupListeners();
    }

    giveFocus(): boolean {
        return this.input.giveFocus();
    }

    giveInputFocus() {
        this.input.giveFocus();

        if (BrowserHelper.isIE()) { // issue with getting focus in IE
            this.input.giveBlur();
            this.input.giveFocus();
        }
    }

    getComboBoxDropdownGrid(): DropdownGrid<OPTION_DISPLAY_VALUE> {
        return this.comboBoxDropdown.getDropdownGrid();
    }

    isDropdownShown(): boolean {
        return this.comboBoxDropdown.isDropdownShown() || this.hasClass(ComboBox.EXPANDED_CLASS);
    }

    isDropdownRendered() {
        return this.hasChild(this.comboBoxDropdown.getDropdownGrid().getElement());
    }

    showDropdown() {
        if (!this.isDropdownRendered()) {
            this.renderDropdown();
        }

        this.comboBoxDropdown.showDropdown(this.getSelectedOptions(), this.isInputEmpty() ? this.noOptionsText : null);

        this.doUpdateDropdownTopPositionAndWidth();

        this.notifyExpanded(true);

        this.dropdownHandle.down();

        this.comboBoxDropdown.renderDropdownGrid();

        this.comboBoxDropdown.resetActiveSelection();

        this.addClass(ComboBox.EXPANDED_CLASS);
    }

    setEmptyDropdownText(label: string) {
        this.comboBoxDropdown.setEmptyDropdownText(label);
    }

    hideDropdown() {
        if (!this.isDropdownShown()) {
            return;
        }

        this.dropdownHandle.up();
        this.comboBoxDropdown.hideDropdown();
        if (this.applySelectionsButton) {
            this.applySelectionsButton.hide();
        }

        this.removeClass(ComboBox.EXPANDED_CLASS);
        if (this.isDropdownRendered()) {
            this.removeDropdown();
        }

        this.optionsToSelect.clear();
        this.optionsToUnselect.clear();
    }

    setOptions(options: Option<OPTION_DISPLAY_VALUE>[], saveSelection?: boolean) {
        this.comboBoxDropdown.setOptions(options, this.isInputEmpty() ? this.noOptionsText : null, this.getSelectedOptions(),
            saveSelection);
        this.comboBoxDropdown.resetActiveSelection();

        this.doUpdateDropdownTopPositionAndWidth();
    }

    isInputEmpty(): boolean {
        return this.input.getValue() === '';
    }

    addOption(option: Option<OPTION_DISPLAY_VALUE>) {
        this.comboBoxDropdown.addOption(option);
    }

    updateOption(option: Option<OPTION_DISPLAY_VALUE>, newOption: Option<OPTION_DISPLAY_VALUE>) {
        const selectedOptions: Option<OPTION_DISPLAY_VALUE>[] = this.getSelectedOptions();

        if (selectedOptions.indexOf(option) >= 0) {
            this.selectedOptionsView.updateOption(option, newOption);
            this.comboBoxDropdown.markSelections(selectedOptions);
        }

        if (this.comboBoxDropdown.getOptionByValue(option.getValue())) {
            this.comboBoxDropdown.updateOption(newOption);
        }
    }

    setIgnoreNextFocus(value: boolean): ComboBox<OPTION_DISPLAY_VALUE> {
        this.ignoreNextFocus = value;
        return this;
    }

    isIgnoreNextFocus(): boolean {
        return this.ignoreNextFocus;
    }

    hasOptions(): boolean {
        return this.comboBoxDropdown.hasOptions();
    }

    getOptionCount(): number {
        return this.comboBoxDropdown.getOptionCount();
    }

    getOptions(): Option<OPTION_DISPLAY_VALUE>[] {
        return this.comboBoxDropdown.getOptions();
    }

    getOptionsByValues(values: string[]): Option<OPTION_DISPLAY_VALUE>[] {
        return this.comboBoxDropdown.getOptionsByValues(values);
    }

    getOptionByValue(value: string): Option<OPTION_DISPLAY_VALUE> {
        return this.comboBoxDropdown.getOptionByValue(value);
    }

    getOptionByRow(rowIndex: number): Option<OPTION_DISPLAY_VALUE> {
        return this.comboBoxDropdown.getOptionByRow(rowIndex);
    }

    setFilterArgs(args: any) {
        this.comboBoxDropdown.setFilterArgs(args);
    }

    handleRowSelected(index: number, keyCode: number = -1) {
        const option: Option<OPTION_DISPLAY_VALUE> = this.getOptionByRow(index);

        if (option) {
            this.toggleOptions([option], keyCode);
        }
    }

    private toggleOptions(options: Option<OPTION_DISPLAY_VALUE>[], keyCode: number = -1): void {
        options.forEach((option: Option<OPTION_DISPLAY_VALUE>) => {
            if (!option.isSelectable()) {
                this.comboBoxDropdown.markSelections(this.getSelectedOptions());
            } else if (!option.isReadOnly()) {
                if (!this.isOptionSelected(option)) {
                    this.selectOption(option, false, keyCode);
                } else {
                    this.deselectOption(option);
                }
            }
        });

        this.refreshDirtyState();
        this.refreshValueChanged();
    }

    private updateOptionsToToggle(): void {
        const displayedOptions: Option<OPTION_DISPLAY_VALUE>[] = this.getDisplayedOptions();
        const selectedOptions: Option<OPTION_DISPLAY_VALUE>[] = this.getSelectedOptions();
        const gridSelectedOptions: Option<OPTION_DISPLAY_VALUE>[] = this.comboBoxDropdown.getDropdownGrid().getGrid().getSelectedRows()
            .map((row: number) => this.comboBoxDropdown.getDropdownGrid().getOptionByRow(row))
            .filter((o: Option<OPTION_DISPLAY_VALUE>) => o);

        displayedOptions.forEach((option: Option<OPTION_DISPLAY_VALUE>) => {
            const isCurrentlySelected: boolean =
                gridSelectedOptions.some((so: Option<OPTION_DISPLAY_VALUE>) => option.getValue() === so.getValue());

            const isPreviouslySelected: boolean =
                selectedOptions.some((so: Option<OPTION_DISPLAY_VALUE>) => option.getValue() === so.getValue());

            if (isCurrentlySelected !== isPreviouslySelected) {
                if (isPreviouslySelected) {
                    this.optionsToUnselect.set(option.getValue(), option);
                } else {
                    this.optionsToSelect.set(option.getValue(), option);
                }
            } else {
                this.optionsToSelect.delete(option.getValue());
                this.optionsToUnselect.delete(option.getValue());
            }
        });
    }

        private handleEnterPressed() {
            // fast alternative to isSelectionChanged()
            if (this.applySelectionsButton && this.applySelectionsButton.isVisible()) {
                this.applySelection(13);
            } else {
                this.handleRowSelected(this.comboBoxDropdown.getActiveRow(), 13);
                this.input.setValue('');
            }
        }

    private applySelection(keyCode: number = -1) {
        this.toggleOptions(Array.from(this.optionsToSelect.values()).concat(Array.from(this.optionsToUnselect.values())), keyCode);
        this.input.setValue('');
        this.hideDropdown();
    }

    private selectOptionHelper(keyCode: number = -1) {
        this.hideDropdown();
        this.addClass('followed-by-options');

        if (this.maximumOccurrencesReached()) {
            this.input.setMaximumReached();
            // Moving focus to the next input upon selecting an option with the Enter key is handled
            // in fireFocusSwitchEvent, hence the check for keyCode...
            if (keyCode !== 13 && this.setNextInputFocusWhenMaxReached && !this.ignoreNextFocus) {
                FormEl.moveFocusToNextFocusable(this.input, 'input, select');
            }
            this.dropdownHandle.setEnabled(false);
        }

        if (this.maximumOccurrencesReached() && this.hideComboBoxWhenMaxReached) {
            this.hide();
        }

        this.ignoreNextFocus = false;
    }

    selectOptions(options: Option<OPTION_DISPLAY_VALUE>[], silent: boolean = false, keyCode: number = -1): void {
        assert(options.every(option => option !== null), 'no option in options can be null');

        const added = this.selectedOptionsView.addOptions(options, silent, keyCode);

        if (!added) { return; }

        this.comboBoxDropdown.markSelections(options);

        this.selectOptionHelper(keyCode);
    }

    selectOption(option: Option<OPTION_DISPLAY_VALUE>, silent: boolean = false, keyCode: number = -1): void {
        assertNotNull(option, 'option cannot be null');

        if (this.isOptionSelected(option)) {
            return;
        }

        const added = this.selectedOptionsView.addOption(option, silent, keyCode);

        if (!added) { return; }

        this.comboBoxDropdown.markSelections(this.getSelectedOptions());

        this.selectOptionHelper(keyCode);
    }

    isOptionSelected(option: Option<OPTION_DISPLAY_VALUE>): boolean {
        return this.selectedOptionsView.isSelected(option);
    }

    deselectOption(option: Option<OPTION_DISPLAY_VALUE>, silent: boolean = false) {
        assertNotNull(option, 'option cannot be null');
        if (!this.isOptionSelected(option)) {
            return;
        }

        this.selectedOptionsView.removeOption(option, silent);

        this.comboBoxDropdown.markSelections(this.getSelectedOptions());
        this.hideDropdown();

        this.input.openForTypingAndFocus();

        this.dropdownHandle.setEnabled(true);

        if (this.hideComboBoxWhenMaxReached) {
            if (this.isVisible() && this.maximumOccurrencesReached()) {
                this.hide();
            }

            if (!this.isVisible() && !this.maximumOccurrencesReached()) {
                this.show();
            }

        }
    }

    clearSelection(ignoreEmpty: boolean = false, giveInputFocus: boolean = true, forceClear: boolean = false, silent: boolean = true) {
        let optionsMap = this.getDisplayedOptions().map((x) => x.getValue()).join();

        let selectedOptions: Option<OPTION_DISPLAY_VALUE>[] = this.getSelectedOptions();
        selectedOptions.forEach((option: Option<OPTION_DISPLAY_VALUE>) => {
            if (forceClear) {
                this.selectedOptionsView.removeOption(option, silent);
            } else {
                // removing selection only from filtered options
                let filteredOption = optionsMap.search(option.getValue()) >= 0 ? option : undefined;
                if (filteredOption && !filteredOption.isReadOnly()) {
                    this.selectedOptionsView.removeOption(option, silent);
                }
            }
        });

        this.comboBoxDropdown.markSelections([], ignoreEmpty);

        if (giveInputFocus) {
            this.input.giveFocus();
        }

        if (this.hideComboBoxWhenMaxReached) {
            this.show();
        }
    }

    removeAllOptions() {
        this.comboBoxDropdown.removeAllOptions();
    }

    getSelectedOptions(): Option<OPTION_DISPLAY_VALUE>[] {
        if (this.selectedOptionsView) {
            return this.selectedOptionsView.getSelectedOptions().map((selectedOption: SelectedOption<OPTION_DISPLAY_VALUE>) => {
                return selectedOption.getOption();
            });
        } else {
            throw new Error('Not supported yet');
        }
    }

    getDisplayedOptions(): Option<OPTION_DISPLAY_VALUE>[] {
        let displayedOptions: Option<OPTION_DISPLAY_VALUE>[] = [];

        for (let row = 0; row < this.comboBoxDropdown.getOptionCount(); row++) {
            let option: Option<OPTION_DISPLAY_VALUE> = this.getOptionByRow(row);
            if (option) {
                displayedOptions.push(option);
            }
        }

        return displayedOptions;
    }

    countSelectedOptions(): number {
        if (this.selectedOptionsView) {
            return this.selectedOptionsView.count();
        } else {
            throw new Error('Not supported yet');
        }
    }

    // Checks added occurrences
    maximumOccurrencesReached(): boolean {
        assert(this.selectedOptionsView != null,
            'No point of calling maximumOccurrencesReached when no multiple selections are enabled');

        return this.selectedOptionsView.maximumOccurrencesReached();
    }

    // Checks selected and added occurrences (with filtering)
    maximumSelectionsReached(): boolean {
        if (this.selectedOptionsView && this.selectedOptionsView.getMaximumOccurrences() !== 0) {

            let totalSelected: number = this.comboBoxDropdown.getSelectedOptionCount();
            let optionsMap = this.getDisplayedOptions().map((x) => x.getValue()).join();
            totalSelected += this.getSelectedOptions().filter(
                (option: Option<OPTION_DISPLAY_VALUE>) => (optionsMap.search(option.getValue()) < 0)).length;

            return this.selectedOptionsView.getMaximumOccurrences() <= totalSelected;
        } else {
            return false;
        }
    }

    setInputIconUrl(iconUrl: string) {
        if (!this.icon) {
            this.icon = new ImgEl();
            this.icon.addClass('input-icon');
            this.icon.insertBeforeEl(this.input);
        }

        this.icon.getEl().setSrc(iconUrl);
    }

    getInput(): ComboBoxOptionFilterInput {
        return this.input;
    }

    setKeyEventsHandler(handler: KeyEventsHandler) {
        this.keyEventsHandler = handler;
    }

    setEnabled(enabled: boolean) {
        super.setEnabled(enabled);
        this.dropdownHandle.setEnabled(enabled);
        this.input.setEnabled(enabled);
    }

    onOptionSelected(listener: (event: SelectedOptionEvent<OPTION_DISPLAY_VALUE>) => void) {
        this.selectedOptionsView.onOptionSelected(listener);
    }

    unOptionSelected(listener: (event: SelectedOptionEvent<OPTION_DISPLAY_VALUE>) => void) {
        this.selectedOptionsView.unOptionSelected(listener);
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

    onContentMissing(listener: (ids: string[]) => void) {
        this.contentMissingListeners.push(listener);
    }

    unContentMissing(listener: (ids: string[]) => void) {
        this.contentMissingListeners = this.contentMissingListeners.filter(function (curr: (ids: string[]) => void) {
            return curr !== listener;
        });
    }

    onValueLoaded(listener: (options: Option<OPTION_DISPLAY_VALUE>[]) => void) {
        this.valueLoadedListeners.push(listener);
    }

    unValueLoaded(listener: (options: Option<OPTION_DISPLAY_VALUE>[]) => void) {
        this.valueLoadedListeners = this.valueLoadedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    onOptionDeselected(listener: (removed: SelectedOptionEvent<OPTION_DISPLAY_VALUE>) => void) {
        this.selectedOptionsView.onOptionDeselected(listener);
    }

    unOptionDeselected(listener: (removed: SelectedOptionEvent<OPTION_DISPLAY_VALUE>) => void) {
        this.selectedOptionsView.unOptionDeselected(listener);
    }

    onOptionMoved(listener: (moved: SelectedOption<OPTION_DISPLAY_VALUE>, fromIndex: number) => void) {
        this.selectedOptionsView.onOptionMoved(listener);
    }

    unOptionMoved(listener: (moved: SelectedOption<OPTION_DISPLAY_VALUE>, fromIndex: number) => void) {
        this.selectedOptionsView.unOptionMoved(listener);
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.input.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.input.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.input.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.input.unBlur(listener);
    }

    onScrolled(listener: (event: WheelEvent) => void) {
        this.comboBoxDropdown.getDropdownGrid().getGrid().subscribeOnScrolled(listener);
    }

    onScroll(listener: (event: Event) => void) {
        this.comboBoxDropdown.getDropdownGrid().getGrid().subscribeOnScroll(listener);
    }

    protected doGetValue(): string {
        if (this.selectedOptionsView) {
            if (!this.getSelectedOptions().length) {
                return null;
            }
            return this.getSelectedOptions().map((item: Option<OPTION_DISPLAY_VALUE>) => item.getValue()).join(ComboBox.VALUE_SEPARATOR);
        } else {
            throw new Error('Not supported yet');
        }
    }

    protected doSetValue(value: string) {
        if (ComboBox.debug) {
            console.debug('ComboBox.doSetValue:', value);
        }
        if (this.countSelectedOptions() > 0) {
            this.clearSelection(false, false, true);
        }

        let optionIds = this.splitValues(value);
        let missingOptionIds = this.getMissingOptionsIds(optionIds);

        if (this.displayMissingSelectedOptions || this.removeMissingSelectedOptions && missingOptionIds.length > 0) {
            this.selectExistingAndHandleMissing(optionIds, missingOptionIds)
                .then((options) => { this.notifyValueLoaded(options); });
        } else {
            const options = this.selectExistingOptions(optionIds);
            this.notifyValueLoaded(options);
        }
    }

    protected splitValues(value: string): string[] {
        return value.split(ComboBox.VALUE_SEPARATOR);
    }

    private doUpdateDropdownTopPositionAndWidth() {
        const dropdownPosition = this.dropdownOverflowsBottom();

        switch (dropdownPosition.position) {
        case PositionType.BELOW:
            this.placeDropdownBelow();
            break;
        case PositionType.ABOVE:
            this.placeDropdownAbove();
            break;
        case PositionType.FLEXIBLE_BELOW:
            // change dd height
            this.comboBoxDropdown.resizeDropdownTo(dropdownPosition.height);
            this.placeDropdownBelow();
            break;
        case PositionType.FLEXIBLE_ABOVE:
            // change dd height
            this.comboBoxDropdown.resizeDropdownTo(dropdownPosition.height);
            this.placeDropdownAbove();
        }

        // reset the custom height, after dropdown is shown
        this.comboBoxDropdown.resetDropdownSize();

        this.comboBoxDropdown.setWidth(Math.max(this.input.getEl().getWidthWithBorder(), this.minWidth));
    }

    private dropdownOverflowsBottom(): DropdownPosition {
        // returns body, if passed element is an html in and iframe
        const restrainToBody = (el: ElementHelper) => {
            return el.getHTMLElement() === document.documentElement ? Body.get().getEl() : el;
        };

        const win = WindowDOM.get();

        const inputEl = this.input.getEl();
        let parent = restrainToBody(this.getScrollableParent(this.input).getEl());
        if (parent === this.getEl()) {
            parent = Body.get().getEl();
        }

        let dropdown = this.comboBoxDropdown.getDropdownGrid().getGrid().getEl();

        if (!dropdown.isVisible()) {
            dropdown = this.comboBoxDropdown.getEmptyDropdown().getEl();
        }

        // If the page is in iframe page is not scrollable and fully rendered
        // The height of the iframe should be used instead
        const containerHeight = (win.isInIFrame() ? new ElementHelper(win.getFrameElement()) : parent).getHeight();

        // distance is measured from the top of the viewport
        const distanceToParentsTop = (win.isInIFrame() ? parent.getScrollTop() : parent.getOffsetTop());
        const distanceToInputsTop = inputEl.getOffsetTop();

        const distanceToParentsBottom = distanceToParentsTop + containerHeight;
        const distanceToInputsBottom = distanceToInputsTop + inputEl.getHeightWithBorder();

        const sizeAboveInput = distanceToInputsTop - distanceToParentsTop - parent.getPaddingTop();
        const sizeBelowInput = distanceToParentsBottom - distanceToInputsBottom - parent.getPaddingBottom();

        const dropdownHeight = dropdown.getHeightWithBorder();

        let position;
        let height;

        if (sizeBelowInput > dropdownHeight) {
            position = PositionType.BELOW;
            height = dropdownHeight;
        } else if (sizeAboveInput > dropdownHeight) {
            position = PositionType.ABOVE;
            height = dropdownHeight;
        } else if (sizeBelowInput < sizeAboveInput) {
            position = PositionType.FLEXIBLE_ABOVE;
            height = sizeAboveInput;
        } else { // (sizeBelowInput > sizeAboveInput)
            position = PositionType.FLEXIBLE_BELOW;
            height = sizeBelowInput;
        }

        return {position, height};
    }

    private placeDropdownBelow() {
        let dropdown = this.comboBoxDropdown.getDropdownGrid().getGrid().getEl();
        dropdown.removeClass('reverted');

        let inputEl = this.input.getEl();
        this.comboBoxDropdown.setTopPx(inputEl.getHeightWithBorder() - inputEl.getBorderBottomWidth());
    }

    private placeDropdownAbove() {
        let dropdown = this.comboBoxDropdown.getDropdownGrid().getGrid().getEl();
        let placeholder = this.comboBoxDropdown.getEmptyDropdown().getEl();

        dropdown.setTopPx(-dropdown.getHeightWithBorder()).addClass('reverted');
        placeholder.setTopPx(-placeholder.getHeightWithBorder());
    }

    private selectExistingOptions(optionIds: string[]) {
        const options = this.getOptionsByValues(optionIds).filter(option => !!option);
        this.selectOptions(options, true);
        return options;
    }

    private selectExistingAndHandleMissing(optionIds: string[],
                                           missingOptionIds: string[]): Q.Promise<Option<OPTION_DISPLAY_VALUE>[]> {
        const nonExistingIds: string[] = [];
        const selectedOptions = [];

        return this.requestMissingOptions(missingOptionIds).then((result: Object) => {
            optionIds.forEach((val) => {
                if (val.trim().length > 0) {
                    const option = this.getOptionByValue(val);
                    if (option == null) {
                        const contentExists = ObjectHelper.propertyExists(result, val);
                        if (this.displayMissingSelectedOptions && (contentExists || !this.removeMissingSelectedOptions)) {
                            const selectedOption = (this.selectedOptionsView as BaseSelectedOptionsView<OPTION_DISPLAY_VALUE>)
                                .makeEmptyOption(val);

                            selectedOptions.push(selectedOption);
                            this.selectOption(selectedOption, true);
                        }
                        if (!contentExists) {
                            nonExistingIds.push(val);
                        }
                    } else {
                        selectedOptions.push(option);
                        this.selectOption(option, true);
                    }
                }
            });

            if (this.removeMissingSelectedOptions && nonExistingIds.length > 0) {
                this.notifyContentMissing(nonExistingIds);
            }

            return selectedOptions;
        });
    }

    private getMissingOptionsIds(values: string[]): string[] {
        let result: string[] = [];
        values.forEach((val) => {
            let option = this.getOptionByValue(val);
            if (option == null && !StringHelper.isBlank(val)) {
                result.push(val);
            }
        });
        return result;
    }

    private setupListeners() {

        AppHelper.focusInOut(this, () => {
            this.hideDropdown();
        });

        this.onScrolled((event: WheelEvent) => {
            event.stopPropagation();
        });

        this.input.onClicked((event: MouseEvent) => {
            this.giveInputFocus();
            event.stopPropagation();
        });

        this.dropdownHandle.onClicked((event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();

            if (!this.maximumOccurrencesReached()) {
                if (this.isDropdownShown()) {
                    this.hideDropdown();
                    this.giveInputFocus();
                } else {
                    this.showDropdown();
                    this.giveInputFocus();
                    this.onDropdownShownCallback().catch((reason) => {
                        DefaultErrorHandler.handle(reason);
                    });
                }
            }
        });

            if (this.applySelectionsButton) {
                this.applySelectionsButton.onClicked(this.applySelection.bind(this));
            }

        this.input.onValueChanged((event: ValueChangedEvent) => {

            this.preservedInputValueChangedEvent = event;
            if (this.delayedInputValueChangedHandling === 0) {
                this.handleInputValueChanged();
            } else if (!event.valuesAreEqual()) {
                this.setEmptyDropdownText(i18n('field.search.placeholder'));
                this.delayedHandleInputValueChangedFnCall.delayCall();
            }
        });

        this.input.onDblClicked((event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();

            if (!this.isDropdownShown()) {
                this.showDropdown();
                this.onDropdownShownCallback().then(() => {
                    this.comboBoxDropdown.navigateToRowIfNotActive();
                }).catch((reason) => {
                    DefaultErrorHandler.handle(reason);
                }).done();
            }
        });

        this.onKeyDown(this.handleKeyDown.bind(this));
        this.getHTMLElement().onpaste = () => {
            if (!this.isDropdownShown()) {
                this.showDropdown();
            }
        };

        if (this.selectedOptionsView) {
            this.selectedOptionsView.onOptionDeselected(() => this.handleSelectedOptionRemoved());
            this.selectedOptionsView.onOptionSelected(() => this.handleSelectedOptionAdded());
            this.selectedOptionsView.onOptionMoved(() => this.handleSelectedOptionMoved());
        }
    }

    private renderDropdown() {
        this.getComboBoxDropdownGrid().getElement().insertAfterEl(this.comboBoxDropdown.getEmptyDropdown());
    }

    private removeDropdown() {
        this.removeChild(this.getComboBoxDropdownGrid().getElement());
    }

    private initDropdown() {
        this.appendChild(this.comboBoxDropdown.getEmptyDropdown());

        this.getComboBoxDropdownGrid().onClick(() => {
            this.giveInputFocus();
        });

        this.comboBoxDropdown.onRowSelection((event: DropdownGridRowSelectedEvent) => {
            this.handleRowSelected(event.getRow());
        });

        this.comboBoxDropdown.onRowCountChanged(AppHelper.debounce(() => {
            const optionsToSelect: Option<OPTION_DISPLAY_VALUE>[] = this.getSelectedOptions()
                .filter((so: Option<OPTION_DISPLAY_VALUE>) => !this.optionsToUnselect.has(so.getValue()))
                .concat(Array.from(this.optionsToSelect.values()));
            this.comboBoxDropdown.markSelections(optionsToSelect);
            this.doUpdateDropdownTopPositionAndWidth();
        }, 200));

        this.comboBoxDropdown.getDropdownGrid().onRowCountChanged(() => {
            if (this.comboBoxDropdown.isDropdownShown()) {
                this.comboBoxDropdown.getDropdownGrid().adjustGridHeight();
                this.doUpdateDropdownTopPositionAndWidth();
            }
        });

        if (this.applySelectionsButton) {
            this.comboBoxDropdown.onMultipleSelection(AppHelper.debounce(this.handleMultipleSelectionChanged.bind(this), 100));
        }
    }

    private handleInputValueChanged() {

        if (this.preservedInputValueChangedEvent) {

            this.notifyOptionFilterInputValueChanged(this.preservedInputValueChangedEvent.getOldValue(),
                this.preservedInputValueChangedEvent.getNewValue());

            this.comboBoxDropdown.resetActiveSelection();
            if (!this.skipAutoDropShowOnValueChange) {
                this.showDropdown();
            }
        }
    }

    private handleKeyDown(event: KeyboardEvent) {
        if (this.keyEventsHandler && this.keyEventsHandler.handle(event)) {
            return;
        }

        if (KeyHelper.isTabKey(event)) { // TAB
            this.hideDropdown();
            return;
        } else if (KeyHelper.isModifierKey(event)) { // CTRL or ALT or SHIFT or MEtA
            return;
        }

        if (!this.isDropdownShown()) {
            if (KeyHelper.isEscKey(event)) { // Escape
                return;
            }

            this.showDropdown();

            if (KeyHelper.isArrowDownKey(event)) { // Down

                this.onDropdownShownCallback().then(() => {
                    this.comboBoxDropdown.navigateToRowIfNotActive();
                }).catch((reason) => {
                    DefaultErrorHandler.handle(reason);
                }).done();

            }
            return;
        }

        if (KeyHelper.isArrowUpKey(event)) { // UP
            if (this.comboBoxDropdown.hasActiveRow()) {
                if (this.comboBoxDropdown.getActiveRow() === 0) {
                    this.comboBoxDropdown.resetActiveSelection();
                    this.input.giveFocus();
                } else {
                    this.comboBoxDropdown.navigateToPreviousRow();
                }
            }
        } else if (KeyHelper.isArrowLeftKey(event)) { // LEFT
            this.comboBoxDropdown.getDropdownGrid().collapseActiveRow();
        } else if (KeyHelper.isArrowRightKey(event)) { // RIGHT
            this.comboBoxDropdown.getDropdownGrid().expandActiveRow();
        } else if (KeyHelper.isArrowDownKey(event)) { // DOWN
            if (this.comboBoxDropdown.hasActiveRow()) {
                this.comboBoxDropdown.navigateToNextRow();
            } else {
                this.comboBoxDropdown.navigateToFirstRow();
            }
        } else if (KeyHelper.isEnterKey(event)) { // ENTER
            this.handleEnterPressed();
        } else if (KeyHelper.isSpace(event)) { // SPACE
            if (this.applySelectionsButton && this.comboBoxDropdown.hasActiveRow()) {
                if (!this.isSelectedRowReadOnly()) {
                    this.comboBoxDropdown.toggleRowSelection(this.comboBoxDropdown.getActiveRow(), this.maximumSelectionsReached());
                }

                event.stopPropagation();
                event.preventDefault();
            }
        } else if (KeyHelper.isBackspace(event)) { // BACKSPACE
            if (!this.input.isEnabled()) {
                event.stopPropagation();
                event.preventDefault();
            }
        } else if (KeyHelper.isEscKey(event)) { // ESCAPE
            this.hideDropdown();
            event.stopPropagation();
            event.preventDefault();
        }

        if (!KeyHelper.isEnterKey(event)) { // ENTER
            this.input.giveFocus();
        }

        if (KeyHelper.isArrowUpKey(event) || KeyHelper.isArrowDownKey(event) || KeyHelper.isEnterKey(event)) { // UP or DOWN or ENTER
            event.stopPropagation();
            event.preventDefault();
        }
    }

    private isSelectedRowReadOnly(): boolean {
        return this.getOptionByRow(this.comboBoxDropdown.getActiveRow()).isReadOnly();
    }

    private handleSelectedOptionRemoved() {
        this.comboBoxDropdown.markSelections(this.getSelectedOptions());

        this.dropdownHandle.setEnabled(true);

        if (this.hideComboBoxWhenMaxReached) {
            this.show();
        }

        if (this.countSelectedOptions() === 0) {
            this.removeClass('followed-by-options');
        }
        this.input.openForTypingAndFocus();

        this.refreshDirtyState();
        this.refreshValueChanged();
    }

    private handleSelectedOptionAdded() {

        this.refreshDirtyState();
        this.refreshValueChanged();
    }

    private handleSelectedOptionMoved() {

        this.refreshDirtyState();
        this.refreshValueChanged();
    }

    private handleMultipleSelectionChanged() {
        this.updateOptionsToToggle();

        if (this.optionsToSelect.size > 0 || this.optionsToUnselect.size > 0) {
            if (this.comboBoxDropdown.isDropdownShown()) {
                this.applySelectionsButton.show();
            }
        } else {
            this.applySelectionsButton.hide();
        }
    }

    private notifyOptionFilterInputValueChanged(oldValue: string, newValue: string) {
        const event: OptionFilterInputValueChangedEvent = new OptionFilterInputValueChangedEvent(oldValue, newValue);

        this.optionFilterInputValueChangedListeners.forEach(
            (listener: (event: OptionFilterInputValueChangedEvent) => void) => {
                listener(event);
            });
    }

    private notifyExpanded(expanded: boolean) {
        const grid: Element = this.comboBoxDropdown.getDropdownGrid().getGrid() as Element;
        const event = new DropdownExpandedEvent(grid, expanded);
        this.expandedListeners.forEach((listener: (event: DropdownExpandedEvent) => void) => {
            listener(event);
        });
    }

    private notifyContentMissing(ids: string[]) {
        this.contentMissingListeners.forEach((listener: (ids: string[]) => void) => {
            listener(ids);
        });
    }

    private notifyValueLoaded(options: Option<OPTION_DISPLAY_VALUE>[]) {
        this.valueLoadedListeners.forEach((listener) => {
            listener(options);
        });
    }
}
