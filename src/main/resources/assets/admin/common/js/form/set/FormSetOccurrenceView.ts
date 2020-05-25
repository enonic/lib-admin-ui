import * as Q from 'q';
import {PropertySet} from '../../data/PropertySet';
import {PropertyArray} from '../../data/PropertyArray';
import {PropertyValueChangedEvent} from '../../data/PropertyValueChangedEvent';
import {ConfirmationDialog} from '../../ui/dialog/ConfirmationDialog';
import {i18n} from '../../util/Messages';
import {Value} from '../../data/Value';
import {AEl} from '../../dom/AEl';
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
import {FormItemOccurrence} from '../FormItemOccurrence';
import {ValidationRecordingPath} from '../ValidationRecordingPath';
import {FormSet} from './FormSet';
import {FormItem} from '../FormItem';
import {HelpTextContainer} from '../HelpTextContainer';

export class FormSetOccurrenceView
    extends FormItemOccurrenceView {

    protected formItemViews: FormItemView[] = [];

    protected validityChangedListeners: { (event: RecordingValidityChangedEvent): void }[] = [];

    protected removeButton: AEl;

    protected label: FormOccurrenceDraggableLabel;

    protected currentValidationState: ValidationRecording;

    protected formItemLayer: FormItemLayer;

    protected propertySet: PropertySet;

    protected formSetOccurrencesContainer: DivEl;

    protected occurrenceContainerClassName: string;

    private dirtyFormItemViewsMap: object = {};

    private deleteOccurrenceConfirmationDialog: ConfirmationDialog;

    private formDataChangedListener: (event: PropertyValueChangedEvent) => void;

    constructor(className: string, formItemOccurrence: FormItemOccurrence<FormItemOccurrenceView>) {
        super(className, formItemOccurrence);

        this.initConfirmationDialog();
        this.initFormDataChangeListener();
    }

    public layout(validate: boolean = true): Q.Promise<void> {

        const deferred = Q.defer<void>();

        this.removeChildren();

        this.removeButton = new AEl('remove-button');
        this.appendChild(this.removeButton);
        this.removeButton.onClicked((event: MouseEvent) => {
            if (this.isDirty() || this.hasNonDefaultValues()) {
                this.deleteOccurrenceConfirmationDialog.setHeading(i18n('dialog.confirm.occurrences.title', this.label.getText()));
                this.deleteOccurrenceConfirmationDialog.open();
            } else {
                this.notifyRemoveButtonClicked();
            }
            event.stopPropagation();
            event.preventDefault();
            return false;
        });

        this.label = new FormOccurrenceDraggableLabel(this.getFormSet().getLabel(), this.getFormSet().getOccurrences());
        this.appendChild(this.label);

        this.label.onClicked(() => this.showContainer(!this.isContainerVisible()));

        if (this.getFormSet().getHelpText()) {
            this.helpText = new HelpTextContainer(this.getFormSet().getHelpText());

            this.helpText.onHelpTextToggled((show) => {
                this.formItemLayer.toggleHelpText(show);
            });

            this.label.appendChild(this.helpText.getToggler());
            this.appendChild(this.helpText.getHelpText());

            this.toggleHelpText(this.getFormSet().isHelpTextOn());
        }

        this.initValidationMessageBlock();

        this.formSetOccurrencesContainer = new DivEl(this.occurrenceContainerClassName);
        this.appendChild(this.formSetOccurrencesContainer);

        const layoutPromise: Q.Promise<FormItemView[]> = this.formItemLayer.setFormItems(this.getFormItems()).setParentElement(
            this.formSetOccurrencesContainer).setParent(this).layout(this.propertySet, validate);

        layoutPromise.then((formItemViews: FormItemView[]) => {

            this.formItemViews = formItemViews;
            if (validate) {
                this.validate(true);
            }

            this.propertySet.onPropertyValueChanged(this.formDataChangedListener);

            this.subscribeOnItemEvents();

            this.refresh();
            deferred.resolve(null);
        }).catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
        }).done();

        return deferred.promise;
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

    showContainer(show: boolean) {
        this.formSetOccurrencesContainer.setVisible(show);
        this.toggleClass('collapsed', !show);
    }

    isContainerVisible(): boolean {
        return this.formSetOccurrencesContainer.isVisible();
    }

    refresh() {
        this.removeButton.setVisible(this.formItemOccurrence.isRemoveButtonRequired());

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

    private initConfirmationDialog() {
        this.deleteOccurrenceConfirmationDialog = new ConfirmationDialog()
            .setQuestion(i18n('dialog.confirm.occurrences.delete'))
            .setYesCallback(() => {
                this.notifyRemoveButtonClicked();
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
}
