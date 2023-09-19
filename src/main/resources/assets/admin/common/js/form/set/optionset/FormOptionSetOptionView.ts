// import * as $ from 'jquery'; // jquery is a peerDependency
import * as Q from 'q';
import {PropertySet} from '../../../data/PropertySet';
import {Occurrences} from '../../Occurrences';
import {Checkbox} from '../../../ui/Checkbox';
import {NotificationDialog} from '../../../ui/dialog/NotificationDialog';
import {i18n} from '../../../util/Messages';
import {DivEl} from '../../../dom/DivEl';
import {DefaultErrorHandler} from '../../../DefaultErrorHandler';
import {Element} from '../../../dom/Element';
import {FormEl} from '../../../dom/FormEl';
import {FormOptionSetOption} from './FormOptionSetOption';
import {FormOptionSetOccurrenceView} from './FormOptionSetOccurrenceView';
import {FormItemView, FormItemViewConfig} from '../../FormItemView';
import {HelpTextContainer} from '../../HelpTextContainer';
import {FormItemLayer} from '../../FormItemLayer';
import {FormOptionSet} from './FormOptionSet';
import {RecordingValidityChangedEvent} from '../../RecordingValidityChangedEvent';
import {ValidationRecording} from '../../ValidationRecording';
import {CreatedFormItemLayerConfig, FormItemLayerFactory} from '../../FormItemLayerFactory';
import {FormItemState} from '../../FormItemState';

export interface FormOptionSetOptionViewConfig
    extends CreatedFormItemLayerConfig {

    layerFactory: FormItemLayerFactory;

    formOptionSetOption: FormOptionSetOption;

    parent: FormOptionSetOccurrenceView;
}

export class FormOptionSetOptionView
    extends FormItemView {

    protected helpText: HelpTextContainer;
    protected parent: FormOptionSetOccurrenceView;
    private formOptionSetOption: FormOptionSetOption;
    private optionItemsContainer: DivEl;
    private formItemViews: FormItemView[] = [];
    private formItemLayer: FormItemLayer;
    private selectionChangedListeners: ((isSelected: boolean) => void)[] = [];
    private checkbox: Checkbox;
    private readonly isOptionSetExpandedByDefault: boolean;
    private formItemState: FormItemState;
    private notificationDialog: NotificationDialog;
    private isSelectedInitially: boolean;

    constructor(config: FormOptionSetOptionViewConfig) {
        super({
            className: 'form-option-set-option-view',
            context: config.context,
            formItem: config.formOptionSetOption,
            parent: config.parent
        } as FormItemViewConfig);

        this.formOptionSetOption = config.formOptionSetOption;

        this.isOptionSetExpandedByDefault = (config.formOptionSetOption.getParent() as FormOptionSet).isExpanded();

        this.formItemState = config.formItemState;

        this.addClass(this.formOptionSetOption.getPath().getElements().length % 2 ? 'even' : 'odd');

        this.formItemLayer = config.layerFactory.createLayer(config);

        this.notificationDialog = new NotificationDialog(i18n('notify.optionset.notempty'));
    }

    toggleHelpText(show?: boolean) {
        this.formItemLayer.toggleHelpText(show);
        this.helpText?.toggleHelpText(show);
    }

    refresh() {
        this.formItemViews.forEach((formItemView: FormItemView) => {
            formItemView.refresh();
        });
    }

    public layout(validate: boolean = true): Q.Promise<void> {
        const deferred = Q.defer<void>();
        const isSingleSelection: boolean = this.parent.isSingleSelection();

        if (this.formOptionSetOption.getHelpText() && !isSingleSelection) {
            this.helpText = new HelpTextContainer(this.formOptionSetOption.getHelpText());

            this.appendChild(this.helpText.getHelpText());

            this.toggleHelpText(this.formOptionSetOption.isHelpTextOn());
        }

        const isDefaultAndNew: boolean = this.formOptionSetOption.isDefaultOption() && !this.isSelected() &&
                                         (this.getContext().getFormState().isNew() || this.formItemState === FormItemState.NEW);

        const optionItemsPropertySet: PropertySet = this.parent.getOrPopulateOptionItemsPropertySet(this.getName());

         if (isDefaultAndNew) {
             this.parent.handleOptionSelected(this);
         }

        this.optionItemsContainer = new DivEl('option-items-container');
        const isContainerVisibleByDefault = this.isOptionSetExpandedByDefault || isSingleSelection || this.isSelected();
        if (isContainerVisibleByDefault) {
            this.appendChild(this.optionItemsContainer);
        }

        const layoutPromise: Q.Promise<FormItemView[]> =
            this.formItemLayer
                .setFormItems(this.formOptionSetOption.getFormItems())
                .setParentElement(this.optionItemsContainer)
                .setParent(this.getParent())
                .layout(optionItemsPropertySet, validate && this.isSelected());

        layoutPromise.then((formItemViews: FormItemView[]) => {
            this.formItemState = FormItemState.EXISTING;
            this.isSelectedInitially = this.isSelected();
            this.updateViewState();

            if (this.formOptionSetOption.getFormItems().length > 0) {
                this.addClass('expandable');
            }

            if (!isSingleSelection) {
                this.prependChild(this.makeSelectionCheckbox());
            }

            this.formItemViews = formItemViews;

            this.onValidityChanged((event: RecordingValidityChangedEvent) => {
                this.toggleClass('invalid', !event.isValid());
            });

            if (validate) {
                this.validate(true);
            }

            deferred.resolve(null);
        }).catch((reason) => {
            DefaultErrorHandler.handle(reason);
        }).done();

        return deferred.promise;
    }

    clean(): void {
        super.clean();

        if (!this.isSelected()) {
            this.clear();
        } else {
            this.formItemViews.forEach((view: FormItemView) => view.clean());
        }
    }

    clear(): void {
        super.clear();
        this.formItemViews.forEach((view: FormItemView) => view.clear());
    }

    getName(): string {
        return this.formOptionSetOption.getName();
    }

    reset() {
        this.isSelectedInitially = this.isSelected();

        this.formItemViews.forEach((formItemView: FormItemView) => {
            formItemView.reset();
        });
    }

    update(parentSet: PropertySet, unchangedOnly?: boolean): Q.Promise<void> {
        const propertySet: PropertySet = this.parent.getOrPopulateOptionItemsPropertySet(this.getName());

        return this.formItemLayer.update(propertySet, unchangedOnly).then(() => {
            this.isSelectedInitially = this.isSelected();
            this.updateViewState();
            this.checkbox?.setChecked(this.isSelected(), true);
        });
    }

    broadcastFormSizeChanged() {
        this.formItemViews.forEach((formItemView: FormItemView) => {
            formItemView.broadcastFormSizeChanged();
        });
    }

    public displayValidationErrors(value: boolean) {
        this.formItemViews.forEach((view: FormItemView) => {
            view.displayValidationErrors(value);
        });
    }

    public setHighlightOnValidityChange(highlight: boolean) {
        this.formItemViews.forEach((view: FormItemView) => {
            view.setHighlightOnValidityChange(highlight);
        });
    }

    hasValidUserInput(): boolean {
        let result = true;
        this.formItemViews.forEach((formItemView: FormItemView) => {
            if (!formItemView.hasValidUserInput()) {
                result = false;
            }
        });

        return result;
    }

    validate(silent: boolean = true): ValidationRecording {
        if (!this.isSelected()) {
            this.toggleClass('hide-validation-errors', true);
            return new ValidationRecording();
        }

        const recording: ValidationRecording = new ValidationRecording();

        this.formItemViews.forEach((formItemView: FormItemView) => {
            recording.flatten(formItemView.validate(silent));
        });

        const hideValidationErrors: boolean = recording.isInvalid() && !this.isSelectedInitially;

        recording.setHideValidationErrors(hideValidationErrors);
        this.toggleClass('hide-validation-errors', hideValidationErrors);

        return recording;
    }

    hasHelpText(): boolean {
        return !!this.helpText;
    }

    isEmpty(): boolean {
        return this.formItemViews.every((formItemView: FormItemView) => formItemView.isEmpty());
    }

    isExpandable(): boolean {
        return this.formItemViews.length > 0;
    }

    getFormItemViews(): FormItemView[] {
        return this.formItemViews;
    }

    onValidityChanged(listener: (event: RecordingValidityChangedEvent) => void) {
        this.formItemViews.forEach((formItemView: FormItemView) => {
            formItemView.onValidityChanged(listener);
        });
    }

    unValidityChanged(listener: (event: RecordingValidityChangedEvent) => void) {
        this.formItemViews.forEach((formItemView: FormItemView) => {
            formItemView.unValidityChanged(listener);
        });
    }

    onSelectionChanged(listener: (isSelected: boolean) => void): void {
        this.selectionChangedListeners.push(listener);
    }

    unSelectionChanged(listener: (isSelected: boolean) => void): void {
        this.selectionChangedListeners.filter((currentListener: (isSelected: boolean) => void) => {
            return listener === currentListener;
        });
    }

    giveFocus(): boolean {
        let focusGiven = false;
        if (this.formItemViews.length > 0) {
            for (const formItemView of this.formItemViews) {
                if (formItemView.giveFocus()) {
                    focusGiven = true;
                    break;
                }
            }
        }
        return focusGiven;
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.formItemViews.forEach((formItemView) => {
            formItemView.onFocus(listener);
        });
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.formItemViews.forEach((formItemView) => {
            formItemView.unFocus(listener);
        });
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.formItemViews.forEach((formItemView) => {
            formItemView.onBlur(listener);
        });
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.formItemViews.forEach((formItemView) => {
            formItemView.unBlur(listener);
        });
    }

    private isSelected(): boolean {
        return this.parent.isSelected(this.getName());
    }

    private makeSelectionCheckbox(): Checkbox {
        const checked: boolean = this.isSelected();
        const labelText: string = this.formOptionSetOption.getLabel();
        const button: Checkbox = Checkbox.create()
            .setLabelText(labelText)
            .setTooltip(labelText)
            .setChecked(checked)
            .build();

        this.checkbox = button;

        button.onChange(() => {
            if (button.isChecked()) {
                this.select();
                this.moveFocusToNextElement(button.getFirstChild());
            } else {
                this.deselectHandle();
                this.notifySelectionChanged(false);
            }
        });

        return button;
    }

    select(): void {
        this.checkbox?.setChecked(true, true);
        this.selectHandle();

        if (!this.isSelected()) {
            this.notifySelectionChanged(true);
        }
    }

    private moveFocusToNextElement(input: Element) {
        const thisElSelector = `div[id='${this.getEl().getId()}']`;
        FormEl.moveFocusToNextFocusable(input,
            thisElSelector + ' input, ' + thisElSelector + ' select, ' + thisElSelector + ' textarea');
    }

    updateCheckBoxDisabled(): void {
        const checkBoxShouldBeDisabled: boolean = !this.isSelected() && this.isSelectionLimitReached();

        if (this.checkbox.isDisabled() !== checkBoxShouldBeDisabled) {
            this.checkbox.setEnabled(!checkBoxShouldBeDisabled);
        }
    }

    enableAndExpand() {
        this.select();
        this.moveFocusToNextElement(this.getChildren()[0]);
    }

    disableAndCollapse() {
        this.deselectHandle();
    }

    private doSelect() {
        this.expand();
        this.enableFormItems();
        this.optionItemsContainer.show();
        this.addClass('selected');
    }

    private selectHandle() {
        if (!this.optionItemsContainer.isRendered()) {
            this.appendChild(this.optionItemsContainer);
        }
        this.doSelect();
    }

    private deselectHandle() {
        this.disableFormItems();

        if (!this.isOptionSetExpandedByDefault) {
            this.collapse();
            this.optionItemsContainer.hide();
        }

        this.cleanValidationForThisOption();
        this.cleanSelectionMessageForThisOption();
        this.removeClass('selected');

        if (!this.isEmpty()) {
            this.notificationDialog.open();
        }
    }

    hasNonDefaultValues(): boolean {
        return this.formItemViews.some(v => v.hasNonDefaultValues());
    }

    private cleanValidationForThisOption() {
        const regExp = /-view(\s|$)/;

        $(this.getEl().getHTMLElement()).find('.invalid').filter(function () {
            return regExp.test(this.className);
        }).each((_index, elem) => {
            $(elem).removeClass('invalid');
            $(elem).find('.validation-viewer ul').html('');
        });

        this.removeClass('invalid');
    }

    private cleanSelectionMessageForThisOption() {
        $(this.getEl().getHTMLElement()).find('.selection-message').addClass('empty');
    }

    private expand() {
        this.addClass('expanded');
    }

    private collapse() {
        this.removeClass('expanded');
    }

    private enableFormItems(): void {
        this.formItemLayer.setEnabled(true);
    }

    private disableFormItems(): void {
        this.formItemLayer.setEnabled(false);
    }

    private isSelectionLimitReached(): boolean {
        return this.getMultiselection().getMaximum() !== 0 &&
               this.getMultiselection().getMaximum() <= this.parent.getTotalSelectedOptions();
    }

    private getMultiselection(): Occurrences {
        return (this.formOptionSetOption.getParent() as FormOptionSet).getMultiselection();
    }

    private updateViewState(): void {
        const isSelected: boolean = this.isSelected();

        if (this.isOptionSetExpandedByDefault || isSelected) {
            this.expand();
        } else {
            this.collapse();
        }

        if (!isSelected) {
            if (this.isOptionSetExpandedByDefault) {
                this.disableFormItems();
            }
            this.cleanValidationForThisOption();
        }

        this.toggleClass('selected', isSelected);

        this.whenRendered(() => {
            if (this.isSelected()) {
                this.enableFormItems();
            } else {
                this.disableFormItems();
            }
        });
    }

    private notifySelectionChanged(isSelected: boolean): void {
        this.selectionChangedListeners.forEach((listener: (isSelected: boolean) => void) => listener(isSelected));
    }

    setEnabled(enable: boolean): void {
        if (this.checkbox) {
            this.toggleCheckboxState(enable);
        }

        this.formItemLayer.setEnabled(enable);
    }

    private toggleCheckboxState(enable: boolean): void {
        if (enable) {
            if (!this.isSelectionLimitReached()) {
                this.checkbox.setEnabled(true);
            }
        } else {
            this.checkbox.setEnabled(false);
        }
    }
}
