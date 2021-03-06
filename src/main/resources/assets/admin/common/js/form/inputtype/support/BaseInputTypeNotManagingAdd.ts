import * as $ from 'jquery';
import * as Q from 'q';
import {Property} from '../../../data/Property';
import {PropertyArray} from '../../../data/PropertyArray';
import {Value} from '../../../data/Value';
import {FormInputEl} from '../../../dom/FormInputEl';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {Input} from '../../Input';
import {InputValidityChangedEvent} from '../InputValidityChangedEvent';
import {Element} from '../../../dom/Element';
import {InputValidationRecording} from '../InputValidationRecording';
import {OccurrenceAddedEvent} from '../../OccurrenceAddedEvent';
import {OccurrenceRenderedEvent} from '../../OccurrenceRenderedEvent';
import {OccurrenceRemovedEvent} from '../../OccurrenceRemovedEvent';
import {ValueChangedEvent} from '../ValueChangedEvent';
import {ClassHelper} from '../../../ClassHelper';
import {ObjectHelper} from '../../../ObjectHelper';
import {InputOccurrenceView} from './InputOccurrenceView';
import {InputOccurrences} from './InputOccurrences';
import {assertNotNull} from '../../../util/Assert';
import {OccurrenceValidationRecord} from './OccurrenceValidationRecord';
import {BaseInputType} from './BaseInputType';

export abstract class BaseInputTypeNotManagingAdd
    extends BaseInputType {

    public static debug: boolean = false;
    protected propertyArray: PropertyArray;
    protected ignorePropertyChange: boolean;
    protected occurrenceValidationState: Map<string, OccurrenceValidationRecord> = new Map<string, OccurrenceValidationRecord>();
    private context: InputTypeViewContext;
    private inputOccurrences: InputOccurrences;
    private occurrenceValueChangedListeners: { (occurrence: Element, value: Value): void }[] = [];
    /**
     * The index of child Data being dragged.
     */
    private draggingIndex: number;

    constructor(context: InputTypeViewContext, className?: string) {
        super('input-type-view' + (className ? ' ' + className : ''));
        assertNotNull(context, 'context cannot be null');
        this.context = context;

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

        let draggedElement = Element.fromHtmlElement(<HTMLElement>ui.item[0]);
        this.draggingIndex = draggedElement.getSiblingIndex();

        ui.placeholder.text('Drop form item set here');
    }

    handleDnDStop(_ui: JQueryUI.SortableUIParams): void {
        //override in child classes if needed
    }

    handleDnDUpdate(ui: JQueryUI.SortableUIParams) {

        if (this.draggingIndex >= 0) {
            let draggedElement = Element.fromHtmlElement(<HTMLElement>ui.item[0]);
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
        this.inputOccurrences.createAndAddOccurrence();
    }

    layout(input: Input, propertyArray: PropertyArray): Q.Promise<void> {
        return super.layout(input, propertyArray).then(() => {
            this.propertyArray = propertyArray;
            this.inputOccurrences =
                InputOccurrences.create().setBaseInputTypeView(this).setInput(this.input).setPropertyArray(propertyArray).build();

            this.onAdded(() => {
                    this.onOccurrenceAdded((event: OccurrenceAddedEvent) => {
                        $(this.getHTMLElement()).sortable('refresh');
                        this.validateOccurrence((<InputOccurrenceView>event.getOccurrenceView()));
                        this.updateValidationRecordAndNotifyIfChanged();
                    });

                    this.onOccurrenceRemoved((event: OccurrenceRemovedEvent) => {
                        this.occurrenceValidationState.delete((<InputOccurrenceView>event.getOccurrenceView()).getInputElement().getId());
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

        return this.inputOccurrences.update(propertyArray, unchangedOnly);
    }

    reset() {
        this.inputOccurrences.reset();
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
        const newValidationRecord: InputValidationRecording = new InputValidationRecording(this.input.getOccurrences(), totalValid);
        newValidationRecord.setValidationMessageToBeRendered(this.isValidationMessageToBeRendered());

        if (newValidationRecord.validityChanged(this.previousValidationRecording) ||
            !ObjectHelper.anyEquals(newValidationRecord.isValidationMessageToBeRendered(),
                this.previousValidationRecording?.isValidationMessageToBeRendered())) {
            this.notifyValidityChanged(new InputValidityChangedEvent(newValidationRecord));
        }

        this.previousValidationRecording = newValidationRecord;
    }

    private updateValidationRecord() {
        const newValidationRecord: InputValidationRecording =
            new InputValidationRecording(this.input.getOccurrences(), this.getTotalValidOccurrences());
        newValidationRecord.setValidationMessageToBeRendered(this.isValidationMessageToBeRendered());

        this.previousValidationRecording = newValidationRecord;
    }

    private isValidationMessageToBeRendered(): boolean {
        if (this.input.getOccurrences().getMinimum() === 1 && this.input.getOccurrences().getMaximum() === 1) {
            let hasValidationError: boolean = false;

            this.occurrenceValidationState.forEach((occurrenceValidationRecord: OccurrenceValidationRecord) => {
                hasValidationError = !!occurrenceValidationRecord.getAdditionalValidationRecord();
            });

            return !hasValidationError;
        }

        return true;
    }

    valueBreaksRequiredContract(value: Value): boolean {
        return value.isNull() || !value.getType().equals(this.getValueType());
    }

    abstract createInputOccurrenceElement(_index: number, _property: Property);

    updateInputOccurrenceElement(_occurrence: Element, _property: Property, _unchangedOnly?: boolean) {
        const formInputEl = ObjectHelper.iFrameSafeInstanceOf(_occurrence, FormInputEl) ? <FormInputEl> _occurrence :
                            ObjectHelper.iFrameSafeInstanceOf(_occurrence.getFirstChild(), FormInputEl)
                            ? <FormInputEl> _occurrence.getFirstChild()
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

    abstract resetInputOccurrenceElement(_occurrence: Element);

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
        }
    }
}
