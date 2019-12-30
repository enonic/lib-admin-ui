import * as $ from 'jquery';
import * as Q from 'q';
import {PropertySet} from '../../../data/PropertySet';
import {Property} from '../../../data/Property';
import {PropertyArray} from '../../../data/PropertyArray';
import {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {Occurrences} from '../../Occurrences';
import {PropertyValueChangedEvent} from '../../../data/PropertyValueChangedEvent';
import {Checkbox} from '../../../ui/Checkbox';
import {NotificationDialog} from '../../../ui/dialog/NotificationDialog';
import {i18n} from '../../../util/Messages';
import {DivEl} from '../../../dom/DivEl';
import {ContentSummary} from '../../../content/ContentSummary';
import {FormEditEvent} from '../../../content/event/FormEditEvent';
import {DefaultErrorHandler} from '../../../DefaultErrorHandler';
import {FormInputEl} from '../../../dom/FormInputEl';
import {RadioButton} from '../../../ui/RadioGroup';
import {ValueTypeString} from '../../../data/ValueTypeString';
import {BrowserHelper} from '../../../BrowserHelper';
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

export interface FormOptionSetOptionViewConfig extends CreatedFormItemLayerConfig {

    layerFactory: FormItemLayerFactory;

    formOptionSetOption: FormOptionSetOption;

    parent: FormOptionSetOccurrenceView;

    parentDataSet: PropertySet;
}

export class FormOptionSetOptionView
    extends FormItemView {

    protected helpText: HelpTextContainer;
    private formOptionSetOption: FormOptionSetOption;
    private parentDataSet: PropertySet;
    private optionItemsContainer: DivEl;
    private formItemViews: FormItemView[] = [];
    private formItemLayer: FormItemLayer;
    private selectionChangedListeners: { (): void }[] = [];
    private checkbox: Checkbox;
    private requiresClean: boolean;
    private isOptionSetExpandedByDefault: boolean;
    private notificationDialog: NotificationDialog;
    private checkboxEnabledStatusHandler: () => void = (() => {
        this.setCheckBoxDisabled();
    });

    private radioDeselectHandler: (event: PropertyValueChangedEvent) => void = ((event: PropertyValueChangedEvent) => {
        if (event.getPreviousValue().getString() === this.getName()) {
            this.deselectHandle();
        }
    });

    private subscribedOnDeselect: boolean = false;

    constructor(config: FormOptionSetOptionViewConfig) {
        super(<FormItemViewConfig> {
            className: 'form-option-set-option-view',
            context: config.context,
            formItem: config.formOptionSetOption,
            parent: config.parent // null
        });

        this.parentDataSet = config.parentDataSet;

        this.formOptionSetOption = config.formOptionSetOption;

        this.isOptionSetExpandedByDefault = (<FormOptionSet>config.formOptionSetOption.getParent()).isExpanded();

        this.addClass(this.formOptionSetOption.getPath().getElements().length % 2 ? 'even' : 'odd');

        this.formItemLayer = config.layerFactory.createLayer(config);

        this.notificationDialog = new NotificationDialog(i18n('notify.optionset.notempty'));

        this.requiresClean = false;
    }

    toggleHelpText(show?: boolean) {
        this.formItemLayer.toggleHelpText(show);
        if (this.helpText) {
            this.helpText.toggleHelpText(show);
        }
    }

    refresh() {
        this.formItemViews.forEach((formItemView: FormItemView) => {
            formItemView.refresh();
        });
    }

    public layout(validate: boolean = true): Q.Promise<void> {
        let deferred = Q.defer<void>();

        if (this.formOptionSetOption.getHelpText()) {
            this.helpText = new HelpTextContainer(this.formOptionSetOption.getHelpText());

            this.appendChild(this.helpText.getHelpText());

            this.toggleHelpText(this.formOptionSetOption.isHelpTextOn());
        }

        this.optionItemsContainer = new DivEl('option-items-container');
        this.appendChild(this.optionItemsContainer);

        let optionItemsPropertySet = this.getOptionItemsPropertyArray(this.parentDataSet).getSet(0);

        let layoutPromise: Q.Promise<FormItemView[]> = this.formItemLayer.setFormItems(
            this.formOptionSetOption.getFormItems()).setParentElement(this.optionItemsContainer).setParent(this.getParent()).layout(
            optionItemsPropertySet, validate && this.isSelected());

        layoutPromise.then((formItemViews: FormItemView[]) => {

            this.updateViewState();

            if (this.formOptionSetOption.getFormItems().length > 0) {
                this.addClass('expandable');
            }

            this.prependChild(this.makeSelectionButton());

            this.formItemViews = formItemViews;

            this.onValidityChanged((event: RecordingValidityChangedEvent) => {
                this.toggleClass('invalid', !event.isValid());
            });

            if (validate) {
                this.validate(true);
            }

            this.formItemViews.forEach((formItemView: FormItemView) => {
                formItemView.onEditContentRequest((content: ContentSummary) => {
                    new FormEditEvent(content).fire();
                });
            });

            deferred.resolve(null);
        }).catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
        }).done();

        return deferred.promise;
    }

    clean() {
        if (!this.isSelected() && this.requiresClean) {
            this.resetAllFormItems();
            this.cleanValidationForThisOption();
            this.requiresClean = false;
        } else if (this.isChildOfDeselectedParent()) {
            this.removeNonDefaultOptionFromSelectionArray();
        }
    }

    getName(): string {
        return this.formOptionSetOption.getName();
    }

    reset() {
        this.formItemViews.forEach((formItemView: FormItemView) => {
            formItemView.reset();
        });
    }

    update(propertySet: PropertySet, unchangedOnly?: boolean): Q.Promise<void> {
        this.parentDataSet = propertySet;
        const propertyArray: PropertyArray = this.getOptionItemsPropertyArray(propertySet);

        return this.formItemLayer.update(propertyArray.getSet(0), unchangedOnly).then(() => {
            if (!this.isRadioSelection()) {
                this.subscribeCheckboxOnPropertyEvents();
            } else {
                const isSelected: boolean = this.isSelected();
                $(this.getHTMLElement()).find('input:radio').first().prop('checked', isSelected);
                if (isSelected) {
                    this.optionItemsContainer.show();
                }

                const selectedProperty = this.getSelectedOptionsArray().get(0);
                if (selectedProperty) {
                    this.subscribeOnRadioDeselect(selectedProperty);
                    this.subscribedOnDeselect = true;
                } else {
                    this.subscribedOnDeselect = false;
                }
            }

            this.updateViewState();
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
            return new ValidationRecording();
        }

        let recording = new ValidationRecording();

        this.formItemViews.forEach((formItemView: FormItemView) => {
            recording.flatten(formItemView.validate(silent));
        });

        this.toggleClass('invalid', !recording.isValid());

        return recording;
    }

    isEmpty(): boolean {
        return this.formItemViews.every((formItemView: FormItemView) => formItemView.isEmpty());
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

    onSelectionChanged(listener: () => void) {
        this.selectionChangedListeners.push(listener);
    }

    unSelectionChanged(listener: () => void) {
        this.selectionChangedListeners.filter((currentListener: () => void) => {
            return listener === currentListener;
        });
    }

    giveFocus(): boolean {
        let focusGiven = false;
        if (this.formItemViews.length > 0) {
            for (let i = 0; i < this.formItemViews.length; i++) {
                if (this.formItemViews[i].giveFocus()) {
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

    private getOptionItemsPropertyArray(propertySet: PropertySet): PropertyArray {
        let propertyArray = propertySet.getPropertyArray(this.getName());
        if (!propertyArray) {
            propertyArray =
                PropertyArray.create().setType(ValueTypes.DATA).setName(this.getName()).setParent(this.parentDataSet).build();
            propertyArray.addSet();
            propertySet.addPropertyArray(propertyArray);
        }
        return propertyArray;
    }

    private getSelectedOptionsArray(): PropertyArray {
        return this.parentDataSet.getPropertyArray('_selected');
    }

    private getThisPropertyFromSelectedOptionsArray(): Property {
        let result: Property = null;
        this.getSelectedOptionsArray().forEach((property: Property) => {
            if (property.getString() === this.getName()) {
                result = property;
            }
        });
        return result;
    }

    private isSelected(): boolean {
        return !!this.getThisPropertyFromSelectedOptionsArray();
    }

    private makeSelectionButton(): FormInputEl {
        if (this.isRadioSelection()) {
            return this.makeSelectionRadioButton();
        } else {
            return this.makeSelectionCheckbox();
        }
    }

    private makeSelectionRadioButton(): RadioButton {
        const selectedProperty = this.getSelectedOptionsArray().get(0);
        const checked = !!selectedProperty && selectedProperty.getString() === this.getName();
        const button = new RadioButton(this.formOptionSetOption.getLabel(), '', this.getParent().getEl().getId(), checked);

        button.onChange(() => {
            let selectedProp = this.getSelectedOptionsArray().get(0);
            if (!selectedProp) {
                selectedProp = this.getSelectedOptionsArray().set(0, new Value(this.getName(), new ValueTypeString()));
                this.subscribeOnRadioDeselect(selectedProp);
                this.subscribedOnDeselect = true;
            } else {
                selectedProp.setValue(new Value(this.getName(), new ValueTypeString()));
                if (!this.subscribedOnDeselect) {
                    this.subscribeOnRadioDeselect(selectedProp);
                    this.subscribedOnDeselect = true;
                }
            }
            this.selectHandle(button.getFirstChild());
            this.notifySelectionChanged();

            if (BrowserHelper.isFirefox() && !this.topEdgeIsVisible(button.getFirstChild())) {
                $(this.getHTMLElement()).closest('.form-panel').scrollTop(
                    this.calcDistToTopOfScrollableArea(button.getFirstChild()));
            }
        });

        if (selectedProperty) {
            this.subscribeOnRadioDeselect(selectedProperty);
            this.subscribedOnDeselect = true;
        }

        return button;
    }

    private topEdgeIsVisible(el: Element): boolean {
        return this.calcDistToTopOfScrollableArea(el) > 0;
    }

    private calcDistToTopOfScrollableArea(el: Element): number {
        return el.getEl().getOffsetTop() - this.getToolbarOffsetTop();
    }

    private getToolbarOffsetTop(delta: number = 0): number {
        let toolbar = $(this.getHTMLElement()).closest('.form-panel').find('.wizard-step-navigator-and-toolbar');
        let stickyToolbarHeight = toolbar.outerHeight(true);
        let offset = toolbar.offset();
        let stickyToolbarOffset = offset ? offset.top : 0;

        return stickyToolbarOffset + stickyToolbarHeight + delta;
    }

    private subscribeOnRadioDeselect(property: Property) {
        property.unPropertyValueChanged(this.radioDeselectHandler);
        property.onPropertyValueChanged(this.radioDeselectHandler);
    }

    private makeSelectionCheckbox(): Checkbox {
        const checked: boolean = this.isSelected();
        const button: Checkbox = Checkbox.create()
            .setLabelText(this.formOptionSetOption.getLabel())
            .setChecked(checked)
            .build();

        this.checkbox = button;

        button.onChange(() => {
            if (button.isChecked()) {
                this.getSelectedOptionsArray().add(new Value(this.getName(), new ValueTypeString()));
                this.selectHandle(button.getFirstChild());
                this.notifySelectionChanged();
            } else {
                const property: Property = this.getThisPropertyFromSelectedOptionsArray();
                if (!!property) {
                    this.getSelectedOptionsArray().remove(property.getIndex());
                }
                this.deselectHandle();
                this.notifySelectionChanged();
            }
        });

        this.setCheckBoxDisabled(checked);
        this.subscribeCheckboxOnPropertyEvents();

        return button;
    }

    private subscribeCheckboxOnPropertyEvents() {
        // as we call this method on each update() call - let's ensure there are no extra handlers binded
        this.getSelectedOptionsArray().unPropertyAdded(this.checkboxEnabledStatusHandler);
        this.getSelectedOptionsArray().unPropertyRemoved(this.checkboxEnabledStatusHandler);

        this.getSelectedOptionsArray().onPropertyAdded(this.checkboxEnabledStatusHandler);
        this.getSelectedOptionsArray().onPropertyRemoved(this.checkboxEnabledStatusHandler);
    }

    private setCheckBoxDisabled(checked?: boolean) {
        let checkBoxShouldBeDisabled = (checked != null ? !checked : !this.checkbox.isChecked()) && this.isSelectionLimitReached();

        if (this.checkbox.isDisabled() !== checkBoxShouldBeDisabled) {
            this.checkbox.setDisabled(checkBoxShouldBeDisabled, 'disabled');
        }
    }

    private selectHandle(input: Element) {
        let thisElSelector = `div[id='${this.getEl().getId()}']`;
        this.expand();
        this.enableFormItems();

        this.optionItemsContainer.show();
        FormEl.moveFocusToNextFocusable(input,
            thisElSelector + ' input, ' + thisElSelector + ' select, ' + thisElSelector + ' textarea');
        this.addClass('selected');
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
        this.requiresClean = true;

        if (!this.isEmpty()) {
            this.notificationDialog.open();
        }
    }

    private removeNonDefaultOptionFromSelectionArray() {
        if (this.formOptionSetOption.isDefaultOption()) {
            return;
        }

        if (this.isRadioSelection()) {
            const selectedProperty = this.getSelectedOptionsArray().get(0);
            const checked = !!selectedProperty && selectedProperty.getString() === this.getName();
            if (checked) {
                this.getSelectedOptionsArray().remove(selectedProperty.getIndex());
                this.removeClass('selected');
            }
        } else if (this.checkbox.isChecked()) {
            const property: Property = this.getThisPropertyFromSelectedOptionsArray();
            if (!!property) {
                this.getSelectedOptionsArray().remove(property.getIndex());
            }
            this.checkbox.setChecked(false, true);
            this.removeClass('selected');
        }
    }

    private isChildOfDeselectedParent(): boolean {
        return $(this.getEl().getHTMLElement()).parents('.form-option-set-option-view').not('.selected').length > 0;
    }

    private cleanValidationForThisOption() {
        let regExp = /-view(\s|$)/;

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

    private enableFormItems() {
        $(this.getEl().getHTMLElement()).find('.option-items-container input, .option-items-container button').each(
            (_index, elem) => {
                elem.removeAttribute('disabled');
            });
    }

    private disableFormItems() {
        $(this.getEl().getHTMLElement()).find('.option-items-container input, .option-items-container button').each(
            (_index, elem) => {
                elem.setAttribute('disabled', 'true');
            });
    }

    private resetAllFormItems(): void {

        const array = this.getOptionItemsPropertyArray(this.parentDataSet);
        array.getSet(0).forEach((property) => {
            this.removeNonDataProperties(property);
        });

        this.update(this.parentDataSet);
    }

    private removeNonDataProperties(property: Property) {
        if (property.getType().equals(ValueTypes.DATA)) {
            property.getPropertySet().forEach((prop) => {
                this.removeNonDataProperties(prop);
            });
        } else if (property.getName() !== '_selected') {
            property.getParent().removeProperty(property.getName(), property.getIndex());
        }
    }

    private isSelectionLimitReached(): boolean {
        return this.getMultiselection().getMaximum() !== 0 &&
               this.getMultiselection().getMaximum() <= this.getSelectedOptionsArray().getSize();
    }

    private isRadioSelection(): boolean {
        return this.getMultiselection().getMinimum() === 1 && this.getMultiselection().getMaximum() === 1;
    }

    private getMultiselection(): Occurrences {
        return (<FormOptionSet>this.formOptionSetOption.getParent()).getMultiselection();
    }

    private updateViewState() {
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
    }

    private notifySelectionChanged() {
        this.selectionChangedListeners.forEach((listener: () => void) => listener());
    }
}
