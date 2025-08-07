import $ from 'jquery';
import Q from 'q';
import {ClassHelper} from '../../../ClassHelper';
import {Property} from '../../../data/Property';
import {PropertyArray} from '../../../data/PropertyArray';
import {Value} from '../../../data/Value';
import {Element} from '../../../dom/Element';
import {FormInputEl} from '../../../dom/FormInputEl';
import {ObjectHelper} from '../../../ObjectHelper';
import {assertNotNull} from '../../../util/Assert';
import {i18n} from '../../../util/Messages';
import {ValidationError} from '../../../ValidationError';
import {AdditionalValidationRecord} from '../../AdditionalValidationRecord';
import {Input} from '../../Input';
import {OccurrenceAddedEvent} from '../../OccurrenceAddedEvent';
import {OccurrenceRemovedEvent} from '../../OccurrenceRemovedEvent';
import {OccurrenceRenderedEvent} from '../../OccurrenceRenderedEvent';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {InputValidationRecording} from '../InputValidationRecording';
import {InputValidityChangedEvent} from '../InputValidityChangedEvent';
import {ValueChangedEvent} from '../ValueChangedEvent';
import {BaseInputType} from './BaseInputType';
import {InputOccurrences} from './InputOccurrences';
import {InputOccurrenceView} from './InputOccurrenceView';
import {OccurrenceValidationRecord} from './OccurrenceValidationRecord';

export abstract class BaseInputTypeNotManagingAdd
    extends BaseInputType {

    public static debug: boolean = false;
    protected propertyArray: PropertyArray;
    protected occurrenceValidationState: Map<string, OccurrenceValidationRecord> = new Map<string, OccurrenceValidationRecord>();
    private inputOccurrences: InputOccurrences;
    private occurrenceValueChangedListeners: ((occurrence: Element, value: Value) => void)[] = [];
    /**
     * The index of child Data being dragged.
     */
    private draggingIndex: number;

    constructor(context: InputTypeViewContext, className?: string) {
        super(context, className);
        assertNotNull(context, 'context cannot be null');

        $(this.getHTMLElement()).sortable({
            axis: 'y',
            containment: 'parent',
            handle: '.drag-control',
            tolerance: 'pointer',
            start: (_event: Event, ui: JQueryUI.SortableUIParams) => this.handleDnDStart(ui),
            stop: (_event: Event, ui: JQueryUI.SortableUIParams) => this.handleDnDStop(ui),
            update: (_event: Event, ui: JQueryUI.SortableUIParams) => this.handleDnDUpdate(ui)
        });
    }

    handleDnDStart(ui: JQueryUI.SortableUIParams): void {

        let draggedElement = Element.fromHtmlElement(ui.item[0]);
        this.draggingIndex = draggedElement.getSiblingIndex();

        ui.placeholder.text('Drop form item set here');
    }

    handleDnDStop(_ui: JQueryUI.SortableUIParams): void {
        //override in child classes if needed
    }

    handleDnDUpdate(ui: JQueryUI.SortableUIParams) {

        if (this.draggingIndex >= 0) {
            let draggedElement = Element.fromHtmlElement(ui.item[0]);
            let draggedToIndex = draggedElement.getSiblingIndex();
            this.inputOccurrences.moveOccurrence(this.draggingIndex, draggedToIndex);
        }

        this.draggingIndex = -1;
    }

    public getContext(): InputTypeViewContext {
        return this.context;
    }

    isManagingAdd(): boolean {
        return false;
    }

    onOccurrenceAdded(listener: (event: OccurrenceAddedEvent) => void) {
        this.inputOccurrences.onOccurrenceAdded(listener);
    }

    onOccurrenceRendered(listener: (event: OccurrenceRenderedEvent) => void) {
        this.inputOccurrences.onOccurrenceRendered(listener);
    }

    onOccurrenceRemoved(listener: (event: OccurrenceRemovedEvent) => void) {
        this.inputOccurrences.onOccurrenceRemoved(listener);
    }

    unOccurrenceAdded(listener: (event: OccurrenceAddedEvent) => void) {
        this.inputOccurrences.unOccurrenceAdded(listener);
    }

    unOccurrenceRendered(listener: (event: OccurrenceRenderedEvent) => void) {
        this.inputOccurrences.onOccurrenceRendered(listener);
    }

    unOccurrenceRemoved(listener: (event: OccurrenceRemovedEvent) => void) {
        this.inputOccurrences.unOccurrenceRemoved(listener);
    }

    onOccurrenceValueChanged(listener: (occurrence: Element, value: Value) => void) {
        this.occurrenceValueChangedListeners.push(listener);
    }

    unOccurrenceValueChanged(listener: (occurrence: Element, value: Value) => void) {
        this.occurrenceValueChangedListeners = this.occurrenceValueChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    onValueChanged(_listener: (event: ValueChangedEvent) => void) {
        throw new Error('User onOccurrenceValueChanged instead');
    }

    unValueChanged(_listener: (event: ValueChangedEvent) => void) {
        throw new Error('User onOccurrenceValueChanged instead');
    }

    public maximumOccurrencesReached(): boolean {
        return this.inputOccurrences.maximumOccurrencesReached();
    }

    createAndAddOccurrence() {
        this.inputOccurrences.addNewOccurrence();
    }

    layout(input: Input, propertyArray: PropertyArray): Q.Promise<void> {
        return super.layout(input, propertyArray).then(() => {
            this.propertyArray = propertyArray;
            this.inputOccurrences =
                InputOccurrences.create().setBaseInputTypeView(this).setInput(this.input).setPropertyArray(propertyArray).build();

            this.onAdded(() => {
                    this.onOccurrenceAdded((event: OccurrenceAddedEvent) => {
                        $(this.getHTMLElement()).sortable('refresh');
                        this.validateOccurrence((event.getOccurrenceView() as InputOccurrenceView));
                        this.updateValidationRecordAndNotifyIfChanged();
                    });

                    this.onOccurrenceRemoved((event: OccurrenceRemovedEvent) => {
                        this.occurrenceValidationState.delete((event.getOccurrenceView() as InputOccurrenceView).getInputElement().getId());
                        this.updateValidationRecordAndNotifyIfChanged();
                    });
                }
            );

            return this.inputOccurrences.layout().then(() => {
                $(this.getHTMLElement()).sortable('refresh');
            });
        });


    }

    update(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void> {
        this.propertyArray = propertyArray;

        return this.inputOccurrences?.update(propertyArray, unchangedOnly);
    }

    reset(): void {
        this.inputOccurrences.reset();
    }

    clear(): void {
        super.clear();
        this.inputOccurrences.clear();
    }

    setEnabled(enable: boolean) {
        this.inputOccurrences.setEnabled(enable);
    }

    hasValidUserInput(): boolean {
        return this.inputOccurrences.hasValidUserInput();
    }

    handleOccurrenceInputValueChanged(inputEl: Element, data?: any) {
        this.validateUserInput(inputEl);
        const value: Value = this.getValue(inputEl, data);
        this.validateRequiredContract(inputEl, value);
        this.notifyOccurrenceValueChanged(inputEl, value);
        this.displayValidationErrors();
        this.updateValidationRecordAndNotifyIfChanged();
    }

    protected abstract getValue(inputEl: Element, data?: any): Value;

    isUserInputValid(_inputElement: Element): boolean {
        return this.occurrenceValidationState.has(_inputElement.getId()) ?
               this.occurrenceValidationState.get(_inputElement.getId()).isValueValid() : true;
    }

    protected validateUserInput(inputEl: Element) {
        this.occurrenceValidationState.set(inputEl.getId(), new OccurrenceValidationRecord());
        this.doValidateUserInput(inputEl);
    }

    protected doValidateUserInput(inputEl: Element) {
        //to be implemented on demand in inheritors
    }

    protected validateRequiredContract(inputEl: Element, value: Value) {
        this.occurrenceValidationState.get(inputEl.getId()).setBreaksRequiredContract(this.valueBreaksRequiredContract(value));
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.inputOccurrences.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.inputOccurrences.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.inputOccurrences.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.inputOccurrences.unBlur(listener);
    }

    displayValidationErrors() {
        this.inputOccurrences.getOccurrenceViews().forEach(
            (view: InputOccurrenceView) => view.displayValidationError(this.occurrenceValidationState.get(view.getInputElement().getId())));
    }

    validate(silent: boolean = true) {
        this.validateOccurrences();

        if (silent) {
            this.updateValidationRecord();
        } else {
            this.updateValidationRecordAndNotifyIfChanged();
        }

    }

    private getTotalValidOccurrences(): number {
        let totalValid: number = 0;

        this.occurrenceValidationState.forEach((occurrenceValidationRecord: OccurrenceValidationRecord) => {
            if (occurrenceValidationRecord.isValid()) {
                totalValid++;
            }
        });

        return totalValid;
    }

    private updateValidationRecordAndNotifyIfChanged() {
        const totalValid: number = this.getTotalValidOccurrences();
        const hasCustomError: boolean = this.hasCustomError();
        const newValidationRecord: InputValidationRecording = new InputValidationRecording(this.input.getOccurrences(), totalValid);

        if (hasCustomError) {
            newValidationRecord.setErrorMessage(i18n('field.occurrence.invalid'));
        }

        if (newValidationRecord.validityChanged(this.previousValidationRecording)) {
            this.notifyValidityChanged(new InputValidityChangedEvent(newValidationRecord));
        }

        this.previousValidationRecording = newValidationRecord;
    }

    private hasCustomError(): boolean {
        let hasCustomError: boolean = false;

        this.occurrenceValidationState.forEach((occurrenceValidationRecord: OccurrenceValidationRecord) => {
            const isCustomError: boolean =
                occurrenceValidationRecord.getAdditionalValidationRecords().some((rec: AdditionalValidationRecord) => rec.isCustom());

            if (isCustomError) {
                hasCustomError = true;
            }
        });

        return hasCustomError;
    }

    private updateValidationRecord() {
        const newValidationRecord: InputValidationRecording =
            new InputValidationRecording(this.input.getOccurrences(), this.getTotalValidOccurrences());

        this.previousValidationRecording = newValidationRecord;
    }

    valueBreaksRequiredContract(value: Value): boolean {
        return value.isNull() || !value.getType().equals(this.getValueType());
    }

    abstract createInputOccurrenceElement(_index: number, _property: Property);

    updateInputOccurrenceElement(_occurrence: Element, _property: Property, _unchangedOnly?: boolean) {
        const formInputEl = ObjectHelper.iFrameSafeInstanceOf(_occurrence, FormInputEl) ? _occurrence as FormInputEl :
                            ObjectHelper.iFrameSafeInstanceOf(_occurrence.getFirstChild(), FormInputEl)
                            ? _occurrence.getFirstChild() as FormInputEl
                            :
                            null;

        if (!formInputEl) {
            return;
        }
        if (!_unchangedOnly || !formInputEl.isDirty()) {
            this.updateFormInputElValue(formInputEl, _property);
        } else if (formInputEl.isDirty()) {
            formInputEl.forceChangedEvent();
        }
    }

    resetInputOccurrenceElement(_occurrence: Element): void {
        this.occurrenceValidationState.delete(_occurrence.getId());
    }

    clearInputOccurrenceElement(_occurrence: Element): void {
        this.occurrenceValidationState.delete(_occurrence.getId());
    }

    abstract setEnabledInputOccurrenceElement(_occurrence: Element, enable: boolean);

    newInitialValue(): Value {
        return this.input?.getDefaultValue() || this.newValueTypeInitialValue();
    }

    protected newValueTypeInitialValue(): Value {
        return this.getValueType().newNullValue();
    }

    giveFocus(): boolean {
        if (this.inputOccurrences) {
            return this.inputOccurrences.giveFocus();
        }
        return false;
    }

    private notifyOccurrenceValueChanged(occurrence: Element, value: Value) {
        this.occurrenceValueChangedListeners.forEach((listener: (occurrence: Element, value: Value) => void) => {
            listener(occurrence, value);
        });
    }

    protected getPropertyValue(property: Property): string {
        return property.hasNonNullValue() ? property.getString() : '';
    }

    protected updateFormInputElValue(_occurrence: FormInputEl, _property: Property) {
        throw new Error('Must be implemented by inheritor: ' + ClassHelper.getClassName(this));
    }

    hideValidationDetailsByDefault(): boolean {
        return true;
    }

    private validateOccurrences() {
        this.inputOccurrences.getOccurrenceViews().forEach((occurrenceView: InputOccurrenceView) => {
            this.validateOccurrence(occurrenceView);
        });
    }

    private validateOccurrence(occurrenceView: InputOccurrenceView) {
        const value: Value = this.propertyArray.getValue(occurrenceView.getIndex());

        if (value) {
            const inputEl: Element = occurrenceView.getInputElement();
            this.validateUserInput(inputEl);
            this.validateRequiredContract(inputEl, value);
            this.validateCustomErrors(occurrenceView);
        }
    }

    protected validateCustomErrors(occurrenceView: InputOccurrenceView): void {
        if (this.context.formContext?.getFormState()?.isNew()) {
            return;
        }

        const occurrenceDataPath: string = occurrenceView.getDataPath().asRelative().toString();
        const occurrenceId: string = occurrenceView.getInputElement().getId();

        this.getContext().formContext.getValidationErrors().forEach((error: ValidationError) => {
            if (occurrenceDataPath === error.getPropertyPath()) {
                occurrenceView.getInputElement().addClass('invalid');
                occurrenceView.getInputElement().removeClass('valid');

                this.occurrenceValidationState.get(occurrenceId).addAdditionalValidation(
                    AdditionalValidationRecord.create().setMessage(error.getMessage()).setCustom(true).build());
            }
        });
    }
}
