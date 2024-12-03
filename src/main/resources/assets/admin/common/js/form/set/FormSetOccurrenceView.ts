import * as Q from 'q';
import {Property} from '../../data/Property';
import {PropertyAddedEvent} from '../../data/PropertyAddedEvent';
import {PropertyArray} from '../../data/PropertyArray';
import {PropertyPath} from '../../data/PropertyPath';
import {PropertyRemovedEvent} from '../../data/PropertyRemovedEvent';
import {PropertySet} from '../../data/PropertySet';
import {PropertyValueChangedEvent} from '../../data/PropertyValueChangedEvent';
import {Value} from '../../data/Value';
import {ValueType} from '../../data/ValueType';
import {ValueTypes} from '../../data/ValueTypes';
import {DivEl} from '../../dom/DivEl';
import {Element} from '../../dom/Element';
import {ObjectHelper} from '../../ObjectHelper';
import {Action} from '../../ui/Action';
import {MoreButton} from '../../ui/button/MoreButton';
import {KeyBinding} from '../../ui/KeyBinding';
import {KeyBindings} from '../../ui/KeyBindings';
import {ConfirmationMask} from '../../ui/mask/ConfirmationMask';
import {i18n} from '../../util/Messages';
import {FormContext} from '../FormContext';
import {FormItem} from '../FormItem';
import {FormItemLayer} from '../FormItemLayer';
import {FormItemOccurrence} from '../FormItemOccurrence';
import {FormItemOccurrenceView, FormItemOccurrenceViewConfig} from '../FormItemOccurrenceView';
import {FormItemView} from '../FormItemView';
import {FormOccurrenceDraggableLabel} from '../FormOccurrenceDraggableLabel';
import {Input} from '../Input';
import {RecordingValidityChangedEvent} from '../RecordingValidityChangedEvent';
import {ValidationRecording} from '../ValidationRecording';
import {ValidationRecordingPath} from '../ValidationRecordingPath';
import {FormSet} from './FormSet';
import {FormItemSet} from './itemset/FormItemSet';
import {FormOptionSet} from './optionset/FormOptionSet';
import {FormOptionSetOption} from './optionset/FormOptionSetOption';

export interface FormSetOccurrenceViewConfig<V extends FormSetOccurrenceView> {
    context: FormContext;

    layer: FormItemLayer;

    formItemOccurrence: FormItemOccurrence<FormItemOccurrenceView>;

    formSet: FormSet;

    parent: FormSetOccurrenceView;

    dataSet: PropertySet;
}

export interface FormSetOccurrenceViewConfigExtended extends FormSetOccurrenceViewConfig<FormSetOccurrenceView>, FormItemOccurrenceViewConfig {
    classPrefix: string;
}

export abstract class FormSetOccurrenceView
    extends FormItemOccurrenceView {

    protected formItemViews: FormItemView[];

    protected validityChangedListeners: ((event: RecordingValidityChangedEvent) => void)[] = [];

    protected moreButton: MoreButton;

    protected label: FormOccurrenceDraggableLabel;

    protected currentValidationState: ValidationRecording;

    protected formItemLayer: FormItemLayer;

    protected propertySet: PropertySet;

    protected formSetOccurrencesContainer: DivEl;

    protected occurrenceContainerClassName: string;

    protected formSet: FormSet;

    protected config: FormSetOccurrenceViewConfigExtended;

    private dirtyFormItemViewsMap: object = {};

    private deleteConfirmationMask: ConfirmationMask;

    private confirmDeleteAction: Action;

    private noAction: Action;

    private formDataChangedListener: (event: PropertyValueChangedEvent) => void;

    private formDataAddedOrRemovedListener: (_event: (PropertyAddedEvent | PropertyRemovedEvent)) => void;

    private expandRequestedListeners: ((view: FormSetOccurrenceView) => void)[] = [];

    protected constructor(classPrefix: string, config: FormSetOccurrenceViewConfig<FormSetOccurrenceView>) {
        super({
            ...config,
            className: `${classPrefix}occurrence-view`,
            classPrefix: classPrefix,
        } as FormSetOccurrenceViewConfigExtended);

        this.layoutElements();
    }

    protected abstract getLabelText(): string;

    protected abstract getLabelSubTitle(): string;

    hasHelpText(): boolean {
        return super.hasHelpText() || this.getFormItemViews().some((view) => view.hasHelpText());
    }

    isExpandable(): boolean {
        return this.formItemViews.length > 0;
    }

    public layout(validate: boolean = true): Q.Promise<void> {
        return this.formItemLayer
            .setFormItems(this.getFormItems())
            .setParent(this)
            .layout(this.propertySet, validate)
            .then((formItemViews: FormItemView[]) => {
                this.formItemViews = formItemViews;

                this.postLayout(validate);

                return Q(null);
            });
    }

    protected postLayout(validate: boolean = true) {
        if (validate) {
            this.validate(true);
        }

        this.bindPropertySet(this.propertySet);

        this.label.setText(this.getLabelText());
        this.label.setSubTitle(this.getLabelSubTitle());

        this.subscribeOnItemEvents();
        this.refresh();
    }

    protected initElements(): void {
        super.initElements();

        this.formItemViews = [];
        this.occurrenceContainerClassName = `${this.config.classPrefix}occurrences-container`;
        this.formSetOccurrencesContainer = new DivEl(this.occurrenceContainerClassName);
        this.formSet = this.config.formSet;
        this.propertySet = this.config.dataSet;
        this.formItemLayer = this.config.layer;
        this.moreButton = this.createMoreButton();
        this.label = new FormOccurrenceDraggableLabel();
        this.formSetOccurrencesContainer.setVisible(false);
        this.confirmDeleteAction = new Action(i18n('action.delete')).setClass('red large delete-button');
        this.noAction = new Action(i18n('action.cancel')).setClass('black large');
        this.deleteConfirmationMask = ConfirmationMask.create()
            .setElement(this)
            .setHideOnScroll(true)
            .setHideOnOutsideClick(true)
            .addAction(this.confirmDeleteAction)
            .addAction(this.noAction)
            .build();
    }

    protected postInitElements(): void {
        super.postInitElements();

        this.label.setExpandable(this.isExpandable());

        if (!this.isExpandable()) {
            this.label.setTitle(i18n('tooltip.header.collapse'));
        }
    }

    protected initListeners() {
        super.initListeners();

        this.label.onClicked(() => this.setContainerVisible(!this.isContainerVisible()));

        this.confirmDeleteAction.onExecuted(() => {
            this.notifyRemoveButtonClicked();
            this.deleteConfirmationMask.hide();
        });

        this.noAction.onExecuted(() => {
            this.deleteConfirmationMask.hide();
        });

        const bindings: KeyBindings = KeyBindings.get();
        const maskBindings: KeyBinding[] = [
            new KeyBinding('esc', () => this.noAction.execute()).setGlobal(true),
        ];

        let shelvedBindings: KeyBinding[];

        this.deleteConfirmationMask.onShown(() => {
            shelvedBindings = bindings.getActiveBindings();
            bindings.shelveBindings(shelvedBindings);
            bindings.bindKeys(maskBindings);
        });

        this.deleteConfirmationMask.onHidden(() => {
            bindings.unbindKeys(maskBindings);
            bindings.unshelveBindings(shelvedBindings);
            shelvedBindings = null;
        });

        this.formDataChangedListener = (event: PropertyValueChangedEvent) => {
            const newValue: Value = event.getNewValue();
            const propertyPathAsString: string = event.getPath().toString();

            if (!!this.dirtyFormItemViewsMap[propertyPathAsString]) {
                if (newValue.equals(this.dirtyFormItemViewsMap[propertyPathAsString]['originalValue'])) {
                    delete this.dirtyFormItemViewsMap[propertyPathAsString];
                } else {
                    this.dirtyFormItemViewsMap[propertyPathAsString]['currentValue'] = newValue;
                }
            } else {
                this.dirtyFormItemViewsMap[propertyPathAsString] = {
                    originalValue: event.getPreviousValue(),
                    currentValue: newValue
                };
            }
            this.updateLabel();
        };

        this.formDataAddedOrRemovedListener = (_event: PropertyAddedEvent | PropertyRemovedEvent) => this.updateLabel();

        this.onRemoved(() => {
            if (this.propertySet) {
                this.releasePropertySet(this.propertySet);
            }
        });
    }

    private initOccurrencesContainer(): void {
        this.formItemLayer.setParentElement(this.formSetOccurrencesContainer);
    }

    protected layoutElements() {
        this.appendChildren<Element>(this.label, this.moreButton, this.formSetOccurrencesContainer);
    }

    hasNonDefaultValues(): boolean {
        return this.formItemViews.some(formItemView => formItemView.hasNonDefaultValues());
    }

    isEmpty(): boolean {
        return this.formItemViews.every((formItemView: FormItemView) => formItemView.isEmpty());
    }

    getDataPath(): PropertyPath {
        return this.propertySet.getProperty().getPath();
    }

    validate(silent: boolean = true): ValidationRecording {
        const allRecordings: ValidationRecording = new ValidationRecording();
        let hideValidationErrors: boolean = true;

        this.formItemViews.forEach((formItemView: FormItemView) => {
            const currRecording: ValidationRecording = formItemView.validate(silent);
            hideValidationErrors = hideValidationErrors && (currRecording.isValid() || currRecording.isValidationErrorsHidden());
            allRecordings.flatten(currRecording);
        });

        hideValidationErrors = allRecordings.isInvalid() && hideValidationErrors;

        this.extraValidation(allRecordings);

        if (!silent) {
            if (allRecordings.validityChanged(this.currentValidationState)) {
                this.notifyValidityChanged(new RecordingValidityChangedEvent(allRecordings, this.resolveValidationRecordingPath()));
            }
        }

        this.currentValidationState = allRecordings;
        this.toggleClass('invalid', !this.isValid());
        this.toggleClass('hide-validation-errors', hideValidationErrors);
        return allRecordings;
    }

    toggleHelpText(show?: boolean): any {
        this.formItemLayer.toggleHelpText(show);
        return super.toggleHelpText(show);
    }

    update(dataSet: PropertySet, unchangedOnly?: boolean): Q.Promise<void> {
        this.updatePropertySet(dataSet);
        return this.formItemLayer.update(this.propertySet, unchangedOnly);
    }

    protected updatePropertySet(dataSet: PropertySet): void {
        this.dirtyFormItemViewsMap = {};
        this.releasePropertySet(this.propertySet);
        this.propertySet = dataSet;
        this.bindPropertySet(this.propertySet);
    }

    hasValidUserInput(): boolean {
        let result: boolean = true;

        this.formItemViews.forEach((formItemView: FormItemView) => {
            if (!formItemView.hasValidUserInput()) {
                result = false;
            }
        });

        return result;
    }

    getContainer(): DivEl {
        return this.formSetOccurrencesContainer;
    }

    setContainerVisible(visible: boolean) {
        if (!this.isExpandable()) {
            return;
        }
        if (visible && !this.formItemLayer.hasParentElement()) {
            this.initOccurrencesContainer();
        }
        this.formSetOccurrencesContainer.setVisible(visible);
        this.toggleClass('collapsed', !visible);
        this.label.setTitle(i18n(visible ? 'tooltip.header.collapse' : 'tooltip.header.expand'));
    }

    isContainerVisible(): boolean {
        // container may be on, but will be not visible
        // if the whole occurrence is hidden (i.e. single select unselected option)
        // so check the style directly
        return !this.formSetOccurrencesContainer ? false : this.formSetOccurrencesContainer.getEl().getDisplay() !== 'none';
    }

    refresh() {
        this.moreButton.getMenuActions().forEach(action => {
            switch (action.getLabel()) {
            case i18n('action.reset'):
                break;
            case i18n('action.addAbove'):
            case i18n('action.addBelow'):
                action.setEnabled(!this.formItemOccurrence.maximumOccurrencesReached());
                break;
            case i18n('action.delete'):
                action.setEnabled(this.formItemOccurrence.isRemoveButtonRequired());
                break;
            }
        });

        this.label.setExpandable(this.isExpandable());

        this.refreshViews();
    }

    refreshViews() {
        this.formItemViews.forEach(itemView => {
            itemView.refresh();
        });
    }

    public reset() {
        this.dirtyFormItemViewsMap = {};
        this.formItemLayer.reset();
        this.validate();
    }

    setEnabled(enable: boolean) {
        this.formItemViews.forEach(itemView => {
            itemView.setEnabled(enable);
        });
    }

    isValid(): boolean {
        if (!this.currentValidationState) {
            return true;
        }

        return this.currentValidationState.isValid();
    }

    getValidationRecording(): ValidationRecording {
        return this.currentValidationState;
    }

    getFormItemViews(): FormItemView[] {
        return this.formItemViews;
    }

    giveFocus() {
        let focusGiven = false;
        this.getFormItemViews().forEach((formItemView: FormItemView) => {
            if (!focusGiven && formItemView.giveFocus()) {
                focusGiven = true;
            }
        });
        return focusGiven;
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

    onValidityChanged(listener: (event: RecordingValidityChangedEvent) => void) {
        this.validityChangedListeners.push(listener);
    }

    unValidityChanged(listener: (event: RecordingValidityChangedEvent) => void) {
        this.validityChangedListeners.filter((currentListener: (event: RecordingValidityChangedEvent) => void) => {
            return listener === currentListener;
        });
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

    clean(): void {
        super.clean();

        this.formItemViews.forEach((view: FormItemView) => view.clean());
    }

    clear(): void {
        super.clear();

        this.formItemViews.forEach((view: FormItemView) => view.clear());
    }

    onExpandRequested(listener: (view: FormSetOccurrenceView) => void): void {
        this.expandRequestedListeners.push(listener);
    }

    unExpandRequested(listener: (view: FormSetOccurrenceView) => void): void {
        this.expandRequestedListeners.filter((currentListener: (view: FormSetOccurrenceView) => void) => {
            return currentListener !== listener;
        });
    }

    protected notifyExpandRequested(view?: FormSetOccurrenceView) {
        this.expandRequestedListeners.forEach((listener: (view: FormSetOccurrenceView) => void) => listener(view || this));
    }

    protected updateLabel() {
        this.label.setText(this.getLabelText());
        this.label.setSubTitle(this.getLabelSubTitle());
    }

    protected extraValidation(_validationRecording: ValidationRecording) {
        // must be implemented by children
    }

    protected subscribeOnItemEvents() {
        this.formItemViews.forEach((formItemView: FormItemView) => {
            formItemView.onValidityChanged((event: RecordingValidityChangedEvent) => {

                if (!this.currentValidationState) {
                    return; // currentValidationState is initialized on validate() call which may not be triggered in some cases
                }

                let previousValidState = this.currentValidationState.isValid();
                if (event.isValid()) {
                    this.currentValidationState.removeByPath(event.getOrigin(), false, event.isIncludeChildren());
                } else {
                    this.currentValidationState.flatten(event.getRecording());
                }

                if (previousValidState !== this.currentValidationState.isValid()) {
                    this.notifyValidityChanged(new RecordingValidityChangedEvent(this.currentValidationState,
                        this.resolveValidationRecordingPath()).setIncludeChildren(true));
                }
            });
        });
    }

    protected getFormSet(): FormSet {
        throw new Error('Must be implemented by inheritor');
    }

    protected getFormItems(): FormItem[] {
        throw new Error('Must be implemented by inheritor');
    }

    protected resolveValidationRecordingPath(): ValidationRecordingPath {
        return new ValidationRecordingPath(this.getDataPath(), null);
    }

    protected notifyValidityChanged(event: RecordingValidityChangedEvent) {
        this.validityChangedListeners.forEach((listener: (event: RecordingValidityChangedEvent) => void) => {
            listener(event);
        });
    }

    private isAllowedValueAndType(property: Property) {
        if (property.getValue().isNull()) {
            return false;
        }
        const propertyType: ValueType = property.getType();

        if (ValueTypes.LOCAL_TIME.equals(propertyType) && property.getString() === '00:00') {
            return false;
        }

        const isAllowedType = [
                ValueTypes.STRING,
                ValueTypes.DOUBLE,
                ValueTypes.LONG,
                ValueTypes.LOCAL_DATE,
                ValueTypes.LOCAL_TIME
            ].some(valueType => valueType.equals(propertyType));

        return isAllowedType && property.getString().length > 0;
    }

    private getRadioButtonTextByValue(radioGroup: Input, selectedValue: string): string {
        const radioButtons: object[] = radioGroup.getInputTypeConfig()['option'];
        if (!radioButtons) {
            return '';
        }

        const selectedRadioButton: object = radioButtons.find((option: object) => option['@value'] === selectedValue);
        return selectedRadioButton['value'];
    }

    private isRadioButtonInput(formItem: FormItem): boolean {
        return (ObjectHelper.iFrameSafeInstanceOf(formItem, Input) &&
                (formItem as Input).getInputType().toString() === 'RadioButton');
    }

    private getPropertyValue(prop: Property, formItem: FormItem): string {
        if (!formItem) {
            return '';
        }

        // Special treatment of RadioButton as it stores button value, not label in the property
        if (this.isRadioButtonInput(formItem)) {
            return this.getRadioButtonTextByValue(formItem as Input, prop.getString());
        }

        return prop.getString();
    }

    protected fetchPropertyValues(propArray: PropertyArray, propValues: string[], firstOnly?: boolean): void {
        propArray.some((prop: Property) => {
            const formItem: FormItem = this.getFormItemByProperty(prop);
            if (!formItem) {
                return false;
            }
            if (this.isAllowedValueAndType(prop)) {
                const propValue: string = this.sanitizeValue(this.getPropertyValue(prop, formItem));

                if (propValue.length > 0) {
                    propValues.push(propValue);
                }
            } else if (ValueTypes.DATA.equals(prop.getType())) {
                const propertySet = prop.getPropertySet();
                if (formItem instanceof FormOptionSet) {
                    this.fetchPropertyValuesFromOptionSet(propertySet, formItem, propValues, firstOnly);
                } else {
                    this.fetchPropertyValuesFromSet(propertySet, propValues, firstOnly);
                }
            }
            return firstOnly && propValues.length > 0;
        });
    }

    private fetchPropertyValuesFromSet(propertySet: PropertySet, propValues: string[], firstOnly: boolean) {
        propertySet.getPropertyArrays().some(array => {
            if ('_selected' === array.getName()) {
                return false;   // skip technical _selected array
            }
            this.fetchPropertyValues(array, propValues, firstOnly);
            return firstOnly && propValues.length > 0;
        });
    }

    private fetchPropertyValuesFromOptionSet(propertySet: PropertySet, formItem: FormOptionSet, propValues: string[], firstOnly: boolean) {
        const selectionArray = propertySet.getPropertyArray('_selected');

        if (selectionArray && !selectionArray.isEmpty()) {
            this.fetchPropertyValuesFromOptions(formItem, selectionArray, propValues);

            if (propValues.length === 0) {
                // should not happen, but in case no labels were found go inside selected options forms
                selectionArray.some((selectedProp) => {
                    const selectedOptionArray = propertySet.getPropertyArray(selectedProp.getString());
                    if (selectedOptionArray && !selectedOptionArray.isEmpty()) {
                        this.fetchPropertyValues(selectedOptionArray, propValues, firstOnly);
                    }
                    return firstOnly && propValues.length > 0;
                });
            }
        }
    }

    private fetchPropertyValuesFromOptions(formItem: FormOptionSet, selectionArray: PropertyArray, propValues: string[]) {
        const nameLabelMap = new Map<string, any>(
            formItem.getFormItems()
                .filter((fi: FormItem) => fi instanceof FormOptionSetOption)
                .map((fo: FormOptionSetOption, index: number) => {
                    return [fo.getName(), {label: fo.getLabel(), index: index}] as [string, any];
                })
        );

        const selectedLabels = selectionArray.getProperties()
            .sort((one: Property, two: Property) => {
                return nameLabelMap.get(one.getString()).index - nameLabelMap.get(two.getString()).index;
            })
            .map((selectedProp: Property) => nameLabelMap.get(selectedProp.getString()).label);

        propValues.push(...selectedLabels);
    }

    private getFormItemByProperty(prop: Property, formItems?: FormItem[]): FormItem {
        let formItem: FormItem;
        const propertyName: string = prop.getName();
        const parentPropertyName: string = prop.getParentProperty().getName();
        (formItems || this.getFormItems()).find((item: FormItem) => {
            if (item.getName() === propertyName && item.getParent().getName() === parentPropertyName) {
                formItem = item;
            } else if (item instanceof FormOptionSetOption || item instanceof FormItemSet) {
                formItem = this.getFormItemByProperty(prop, item.getFormItems());
            }
            return !!formItem;
        });

        return formItem;
    }

    private sanitizeValue(label: string): string {
        return label
            .replace(/<\/?[^>]+(>|$)/g, '') // removing tags
            .replace(/&nbsp;/g, '') // removing spaces
            .replace(/\s{2,}/g, ' ') // removing spaces
            .replace(/\n/g, ' ') // removing linebreaks
            .trim();
    }

    private releasePropertySet(set: PropertySet) {
        set.unPropertyValueChanged(this.formDataChangedListener);
        set.unPropertyAdded(this.formDataAddedOrRemovedListener);
        set.unPropertyRemoved(this.formDataAddedOrRemovedListener);
    }

    private bindPropertySet(set: PropertySet) {
        set.onPropertyValueChanged(this.formDataChangedListener);
        set.onPropertyAdded(this.formDataAddedOrRemovedListener);
        set.onPropertyRemoved(this.formDataAddedOrRemovedListener);
    }

    private isDirty(): boolean {
        return Object.keys(this.dirtyFormItemViewsMap).length > 0;
    }

    private createMoreButton(): MoreButton {
        const addAboveAction = new Action(i18n('action.addAbove')).onExecuted(_action => {
            void this.formItemOccurrence.addOccurrenceAbove().then((view: FormItemOccurrenceView) => {
                const setView = view as FormSetOccurrenceView;
                this.notifyExpandRequested(setView);
            });
        });
        const addBelowAction = new Action(i18n('action.addBelow')).onExecuted(_action => {
            void this.formItemOccurrence.addOccurrenceBelow().then((view: FormItemOccurrenceView) => {
                const setView = view as FormSetOccurrenceView;
                this.notifyExpandRequested(setView);
            });
        });
        const removeAction = new Action(i18n('action.delete')).onExecuted(_action => {
            if (this.isDirty() || this.hasNonDefaultValues()) {
                this.setContainerVisible(true);
                this.notifyExpandRequested();
                const label = this.formSet.getLabel();
                if (label) {
                    this.confirmDeleteAction.setLabel(i18n('dialog.confirm.occurrences.delete', label));
                }
                this.deleteConfirmationMask.show();
            } else {
                this.notifyRemoveButtonClicked();
            }
        });

        return new MoreButton([addAboveAction, addBelowAction, removeAction]);
    }

    getLabelEl(): FormOccurrenceDraggableLabel {
        return this.label;
    }

}
