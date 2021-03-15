import * as $ from 'jquery';
import * as Q from 'q';
import {Property} from '../../../data/Property';
import {PropertyArray} from '../../../data/PropertyArray';
import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {InputTypeView} from '../InputTypeView';
import {FormInputEl} from '../../../dom/FormInputEl';
import {DivEl} from '../../../dom/DivEl';
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
import {ContentSummary} from '../../../content/ContentSummary';
import {ObjectHelper} from '../../../ObjectHelper';
import {InputOccurrenceView} from './InputOccurrenceView';
import {InputOccurrences} from './InputOccurrences';
import {assertNotNull} from '../../../util/Assert';
import {OccurrenceValidationRecord} from './OccurrenceValidationRecord';

export abstract class BaseInputTypeNotManagingAdd
    extends DivEl
    implements InputTypeView {

    public static debug: boolean = false;
    protected propertyArray: PropertyArray;
    protected ignorePropertyChange: boolean;
    protected occurrenceValidationState: Map<string, OccurrenceValidationRecord> = new Map<string, OccurrenceValidationRecord>();
    private context: InputTypeViewContext;
    private input: Input;
    private inputOccurrences: InputOccurrences;
    private inputValidityChangedListeners: { (event: InputValidityChangedEvent): void }[] = [];
    private inputValueChangedListeners: { (occurrence: Element, value: Value): void }[] = [];
    private previousValidationRecord: InputValidationRecording;
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

    availableSizeChanged() {
        // must be implemented by children
    }

    public getContext(): InputTypeViewContext {
        return this.context;
    }

    getElement(): Element {
        return this;
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
        this.inputValueChangedListeners.push(listener);
    }

    unOccurrenceValueChanged(listener: (occurrence: Element, value: Value) => void) {
        this.inputValueChangedListeners = this.inputValueChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    onValueChanged(_listener: (event: ValueChangedEvent) => void) {
        throw new Error('User onOccurrenceValueChanged instead');
    }

    unValueChanged(_listener: (event: ValueChangedEvent) => void) {
        throw new Error('User onOccurrenceValueChanged instead');
    }

    onValidityChanged(listener: (event: InputValidityChangedEvent) => void) {
        this.inputValidityChangedListeners.push(listener);
    }

    unValidityChanged(listener: (event: InputValidityChangedEvent) => void) {
        this.inputValidityChangedListeners.filter((currentListener: (event: InputValidityChangedEvent) => void) => {
            return listener === currentListener;
        });
    }

    public maximumOccurrencesReached(): boolean {
        return this.inputOccurrences.maximumOccurrencesReached();
    }

    createAndAddOccurrence() {
        this.inputOccurrences.createAndAddOccurrence();
    }

    layout(input: Input, propertyArray: PropertyArray): Q.Promise<void> {

        this.input = input;
        this.propertyArray = propertyArray;
        this.inputOccurrences =
            InputOccurrences.create().setBaseInputTypeView(this).setInput(this.input).setPropertyArray(propertyArray).build();

        this.onAdded(() => {
                this.onOccurrenceAdded(() => {
                    $(this.getHTMLElement()).sortable('refresh');
                });

                this.onOccurrenceRemoved((event: OccurrenceRemovedEvent) => {
                    this.occurrenceValidationState.delete((<InputOccurrenceView>event.getOccurrenceView()).getInputElement().getId());
                    this.updateValidationRecord();
                });
            }
        );

        return this.inputOccurrences.layout().then(() => {
            $(this.getHTMLElement()).sortable('refresh');
        });
    }

    update(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void> {
        this.propertyArray = propertyArray;

        return this.inputOccurrences.update(propertyArray, unchangedOnly);
    }

    reset() {
        this.inputOccurrences.reset();
    }

    refresh() {
        //to be implemented on demand in inheritors
    }

    setEnabled(enable: boolean) {
        this.inputOccurrences.setEnabled(enable);
    }

    hasValidUserInput(recording?: InputValidationRecording): boolean {
        return this.inputOccurrences.hasValidUserInput(recording);
    }

    handleOccurrenceInputValueChanged(inputEl: Element, data?: any) {
        this.validateUserInput(inputEl);
        const value: Value = this.getValue(inputEl, data);
        this.validateRequiredContract(inputEl, value);
        this.notifyOccurrenceValueChanged(inputEl, value);
        const currentOccurrenceValidationRecord: OccurrenceValidationRecord = this.occurrenceValidationState.get(inputEl.getId());

        if (this.previousValidationRecord.isValid() !== currentOccurrenceValidationRecord.isValid()) {
            this.updateValidationRecord();
        }
    }

    private updateValidationRecord() {
        const newValidationRecord: InputValidationRecording = this.getCurrentValidationRecord();

        if (newValidationRecord.validityChanged(this.previousValidationRecord)) {
            this.notifyValidityChanged(new InputValidityChangedEvent(newValidationRecord, this.input.getName()));
        }

        this.previousValidationRecord = newValidationRecord;
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

    displayValidationErrors(_value: boolean) {
        // must be implemented by children
    }

    validate(silent: boolean = true): InputValidationRecording {
        console.log('validate: ' + this.getId());

        this.validateOccurrences();
        const newValidationRecord: InputValidationRecording = this.getCurrentValidationRecord();

        if (!silent && newValidationRecord.validityChanged(this.previousValidationRecord)) {
            this.notifyValidityChanged(new InputValidityChangedEvent(newValidationRecord, this.input.getName()));
        }

        this.previousValidationRecord = newValidationRecord;

        return newValidationRecord;
    }

    private getCurrentValidationRecord(): InputValidationRecording {
        const record: InputValidationRecording = new InputValidationRecording();
        let totalValid: number = 0;

        this.occurrenceValidationState.forEach((occurrenceValidationRecord: OccurrenceValidationRecord) => {
            if (occurrenceValidationRecord.isValid()) {
                totalValid++;
            } else if (!occurrenceValidationRecord.isValueValid()) {
                record.setAdditionalValidationRecord(occurrenceValidationRecord.getAdditionalValidationRecord());
            }
        });

        if (totalValid < this.input.getOccurrences().getMinimum()) {
            record.setBreaksMinimumOccurrences(true);
        }

        if (this.input.getOccurrences().maximumBreached(totalValid)) {
            record.setBreaksMaximumOccurrences(true);
        }

        return record;
    }

    getInput(): Input {
        return this.input;
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

    abstract getValueType(): ValueType;

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

    onEditContentRequest(_listener: (content: ContentSummary) => void) {
        // Adapter for InputTypeView method, to be implemented on demand in inheritors
    }

    unEditContentRequest(_listener: (content: ContentSummary) => void) {
        // Adapter for InputTypeView method, to be implemented on demand in inheritors
    }

    protected notifyOccurrenceValueChanged(occurrence: Element, value: Value) {
        this.inputValueChangedListeners.forEach((listener: (occurrence: Element, value: Value) => void) => {
            listener(occurrence, value);
        });
    }

    protected getPropertyValue(property: Property): string {
        return property.hasNonNullValue() ? property.getString() : '';
    }

    protected updateFormInputElValue(_occurrence: FormInputEl, _property: Property) {
        throw new Error('Must be implemented by inheritor: ' + ClassHelper.getClassName(this));
    }

    private notifyValidityChanged(event: InputValidityChangedEvent) {
        this.inputValidityChangedListeners.forEach((listener: (event: InputValidityChangedEvent) => void) => {
            listener(event);
        });
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
