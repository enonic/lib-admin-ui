import * as Q from 'q';
import {PropertySet} from '../../data/PropertySet';
import {PropertyArray} from '../../data/PropertyArray';
import {PropertyValueChangedEvent} from '../../data/PropertyValueChangedEvent';
import {i18n} from '../../util/Messages';
import {Value} from '../../data/Value';
import {DivEl} from '../../dom/DivEl';
import {DefaultErrorHandler} from '../../DefaultErrorHandler';
import {PropertyPath} from '../../data/PropertyPath';
import {ContentSummary} from '../../content/ContentSummary';
import {FormItemOccurrenceView} from '../FormItemOccurrenceView';
import {FormItemView} from '../FormItemView';
import {RecordingValidityChangedEvent} from '../RecordingValidityChangedEvent';
import {FormOccurrenceDraggableLabel} from '../FormOccurrenceDraggableLabel';
import {ValidationRecording} from '../ValidationRecording';
import {FormItemLayer} from '../FormItemLayer';
import {ValidationRecordingPath} from '../ValidationRecordingPath';
import {FormSet} from './FormSet';
import {FormItem} from '../FormItem';
import {FormContext} from '../FormContext';
import {FormSetOccurrence} from './FormSetOccurrence';
import {Action} from '../../ui/Action';
import {MoreButton} from '../../ui/button/MoreButton';
import {ConfirmationMask} from '../../ui/mask/ConfirmationMask';
import {ElementEvent} from '../../dom/ElementEvent';
import {Dropdown} from '../../ui/selector/dropdown/Dropdown';
import {Element} from '../../dom/Element';
import {KeyBindings} from '../../ui/KeyBindings';
import {KeyBinding} from '../../ui/KeyBinding';

export interface FormSetOccurrenceViewConfig<V extends FormSetOccurrenceView> {
    context: FormContext;

    layer: FormItemLayer;

    formSetOccurrence: FormSetOccurrence<V>;

    formSet: FormSet;

    parent: FormSetOccurrenceView;

    dataSet: PropertySet;
}

export abstract class FormSetOccurrenceView
    extends FormItemOccurrenceView {

    protected formItemViews: FormItemView[] = [];

    protected validityChangedListeners: { (event: RecordingValidityChangedEvent): void }[] = [];

    protected moreButton: MoreButton;

    protected label: FormOccurrenceDraggableLabel;

    protected currentValidationState: ValidationRecording;

    protected formItemLayer: FormItemLayer;

    protected propertySet: PropertySet;

    protected formSetOccurrencesContainer: DivEl;

    protected occurrenceContainerClassName: string;

    protected formSet: FormSet;

    private dirtyFormItemViewsMap: object = {};

    private deleteConfirmationMask: ConfirmationMask;

    private confirmDeleteAction: Action;

    private formDataChangedListener: (event: PropertyValueChangedEvent) => void;

    private expandRequestedListeners: { (view: FormSetOccurrenceView): void }[] = [];

    constructor(classPrefix: string, config: FormSetOccurrenceViewConfig<FormSetOccurrenceView>) {
        super(`${classPrefix}occurrence-view`, config.formSetOccurrence);

        this.occurrenceContainerClassName = `${classPrefix}occurrences-container`;
        this.formItemOccurrence = config.formSetOccurrence;
        this.formSet = config.formSet;
        this.propertySet = config.dataSet;
        this.formItemLayer = config.layer;

        this.initConfirmationMask();
        this.initFormDataChangeListener();
    }

    hasHelpText(): boolean {
        return super.hasHelpText() || this.getFormItemViews().some((view) => view.hasHelpText());
    }

    protected abstract getLabelText(): string;

    isSingleSelection(): boolean {
        return false;
    }

    isExpandable(): boolean {
        return this.formItemViews.length > 0;
    }

    createSingleSelectionCombo(): Dropdown<any> {
        return null;
    }

    public layout(validate: boolean = true): Q.Promise<void> {

        this.removeChildren();

        this.moreButton = this.createMoreButton();

        const labelText = this.getFormSet().getLabel();
        this.label = new FormOccurrenceDraggableLabel(this.getLabelText(), this.getFormSet().getOccurrences(), labelText);
        if (!this.isExpandable()) {
            this.label.setTitle(i18n('tooltip.header.collapse'));
        }
        this.label.setExpandable(this.isExpandable());
        if (!this.isSingleSelection()) {
            this.appendChildren<Element>(this.moreButton, this.label);
        } else {
            const headerDiv = new DivEl('single-selection-header');
            const dropdown = this.createSingleSelectionCombo();
            dropdown.onOptionSelected((_event) => {
                headerDiv.addClass('selected');
            });
            dropdown.onOptionDeselected((_event) => {
                headerDiv.removeClass('selected');
            });
            headerDiv.appendChildren<Element>(new DivEl('drag-control'), dropdown, this.label, this.moreButton);
            this.appendChild(headerDiv);
        }

        this.label.onClicked(() => this.setContainerVisible(!this.isContainerVisible()));
        this.initValidationMessageBlock();

        this.formSetOccurrencesContainer = new DivEl(this.occurrenceContainerClassName);
        this.appendChild(this.formSetOccurrencesContainer);

        return this.formItemLayer
            .setFormItems(this.getFormItems())
            .setParentElement(this.formSetOccurrencesContainer)
            .setParent(this)
            .layout(this.propertySet, validate)
            .then((formItemViews: FormItemView[]) => {

                this.formItemViews = formItemViews;
                if (validate) {
                    this.validate(true);
                }
                this.propertySet.onPropertyValueChanged(this.formDataChangedListener);

                if (!this.isExpandable()) {
                    this.setContainerVisible(false);
                }

                this.subscribeOnItemEvents();
                this.refresh();

            })
            .catch(DefaultErrorHandler.handle)
            .then(() => {
                if (this.formItemOccurrence.isMultiple()) {
                    this.formSetOccurrencesContainer.onDescendantAdded((event: ElementEvent) => {
                        if (this.getEl().contains(event.getElement().getHTMLElement())) {
                            this.updateLabel();
                        }
                    });
                }
            });
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

        const allRecordings = new ValidationRecording();

        this.formItemViews.forEach((formItemView: FormItemView) => {
            const currRecording = formItemView.validate(silent);
            allRecordings.flatten(currRecording);
        });

        this.extraValidation(allRecordings);

        if (!silent) {
            if (allRecordings.validityChanged(this.currentValidationState)) {
                this.notifyValidityChanged(new RecordingValidityChangedEvent(allRecordings, this.resolveValidationRecordingPath()));
            }
        }
        this.currentValidationState = allRecordings;
        this.toggleClass('invalid', !this.isValid());
        return allRecordings;
    }

    toggleHelpText(show?: boolean): any {
        this.formItemLayer.toggleHelpText(show);
        return super.toggleHelpText(show);
    }

    update(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void> {
        let set = propertyArray.getSet(this.formItemOccurrence.getIndex());
        if (!set) {
            set = propertyArray.addSet();
        }
        this.ensureSelectionArrayExists(set);
        this.dirtyFormItemViewsMap = {};
        this.propertySet.unPropertyValueChanged(this.formDataChangedListener);
        this.propertySet = set;
        this.propertySet.onPropertyValueChanged(this.formDataChangedListener);
        return this.formItemLayer.update(this.propertySet, unchangedOnly);
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

    getContainer(): DivEl {
        return this.formSetOccurrencesContainer;
    }

    setContainerVisible(visible: boolean) {
        if (!this.isExpandable()) {
            return;
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
        return this.formItemLayer.reset();
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

    onEditContentRequest(listener: (content: ContentSummary) => void) {
        this.formItemViews.forEach((formItemView: FormItemView) => {
            formItemView.onEditContentRequest(listener);
        });
    }

    unEditContentRequest(listener: (content: ContentSummary) => void) {
        this.formItemViews.forEach((formItemView: FormItemView) => {
            formItemView.unEditContentRequest(listener);
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
    }

    protected initValidationMessageBlock() {
        // must be implemented by children
    }

    protected extraValidation(_validationRecording: ValidationRecording) {
        // must be implemented by children
    }

    protected subscribeOnItemEvents() {
        throw new Error('Must be implemented by inheritor');
    }

    protected getFormSet(): FormSet {
        throw new Error('Must be implemented by inheritor');
    }

    protected getFormItems(): FormItem[] {
        throw new Error('Must be implemented by inheritor');
    }

    protected ensureSelectionArrayExists(_propertyArraySet: PropertySet) {
        // override if needed to add default selection to property set
    }

    protected resolveValidationRecordingPath(): ValidationRecordingPath {
        return new ValidationRecordingPath(this.getDataPath(), null);
    }

    protected notifyValidityChanged(event: RecordingValidityChangedEvent) {
        this.validityChangedListeners.forEach((listener: (event: RecordingValidityChangedEvent) => void) => {
            listener(event);
        });
    }

    protected getSelectedOptionsArray(): PropertyArray {
        return this.propertySet.getPropertyArray('_selected');
    }

    private initConfirmationMask() {
        this.confirmDeleteAction = new Action(i18n('action.delete'))
            .setClass('red large delete-button')
            .onExecuted(_action => {
                this.notifyRemoveButtonClicked();
                this.deleteConfirmationMask.hide();
            });
        const noAction = new Action(i18n('action.cancel'))
            .setClass('black large')
            .onExecuted(_action => {
                this.deleteConfirmationMask.hide();
            });

        this.deleteConfirmationMask = ConfirmationMask.create()
            .setElement(this)
            .setHideOnScroll(true)
            .setHideOnOutsideClick(true)
            .addAction(this.confirmDeleteAction)
            .addAction(noAction)
            .build();

        const bindings = KeyBindings.get();
        const maskBindings = [
            new KeyBinding('esc', () => noAction.execute()).setGlobal(true),
        ];
        let shelvedBindings;

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
    }

    private initFormDataChangeListener() {
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
        };

        this.onRemoved(() => {
            if (this.propertySet) {
                this.propertySet.unPropertyValueChanged(this.formDataChangedListener);
            }
        });
    }

    private isDirty(): boolean {
        return Object.keys(this.dirtyFormItemViewsMap).length > 0;
    }

    private createMoreButton(): MoreButton {
        const addAboveAction = new Action(i18n('action.addAbove')).onExecuted(_action => {
            void this.formItemOccurrence.addOccurrenceAbove().then(view => {
                const setView = <FormSetOccurrenceView>view;
                this.notifyExpandRequested(setView);
            });
        });
        const addBelowAction = new Action(i18n('action.addBelow')).onExecuted(_action => {
            void this.formItemOccurrence.addOccurrenceBelow().then(view => {
                const setView = <FormSetOccurrenceView>view;
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
}
