import * as Q from 'q';
import {Property} from '../../../data/Property';
import {PropertyArray} from '../../../data/PropertyArray';
import {PropertyValueChangedEvent} from '../../../data/PropertyValueChangedEvent';
import {FormItemOccurrenceView} from '../../FormItemOccurrenceView';
import {Element} from '../../../dom/Element';
import {DivEl} from '../../../dom/DivEl';
import {Value} from '../../../data/Value';
import {PropertyPath} from '../../../data/PropertyPath';
import {InputValidationRecording} from '../InputValidationRecording';
import {InputOccurrence} from './InputOccurrence';
import {BaseInputTypeNotManagingAdd} from './BaseInputTypeNotManagingAdd';
import {ButtonEl} from '../../../dom/ButtonEl';

export class InputOccurrenceView
    extends FormItemOccurrenceView {

    public static debug: boolean = false;
    private inputOccurrence: InputOccurrence;
    private property: Property;
    private inputTypeView: BaseInputTypeNotManagingAdd;
    private inputElement: Element;
    private removeButtonEl: ButtonEl;
    private dragControl: DivEl;
    private requiredContractBroken: boolean;
    private propertyValueChangedHandler: (event: PropertyValueChangedEvent) => void;
    private occurrenceValueChangedHandler: (occurrence: Element, value: Value) => void;

    constructor(inputOccurrence: InputOccurrence, baseInputTypeView: BaseInputTypeNotManagingAdd, property: Property) {
        super('input-occurrence-view', inputOccurrence);

        this.inputTypeView = baseInputTypeView;
        this.inputElement = this.inputTypeView.createInputOccurrenceElement(inputOccurrence.getIndex(), property);

        this.requiredContractBroken = this.inputTypeView.valueBreaksRequiredContract(property != null ? property.getValue() : null);

        this.initListeners();

        this.registerProperty(property);

        this.inputOccurrence = inputOccurrence;

        this.dragControl = new DivEl('drag-control');
        this.appendChild(this.dragControl);

        this.removeButtonEl = new ButtonEl();
        this.removeButtonEl.addClass('remove-button');
        this.removeButtonEl.onClicked((event: MouseEvent) => {
            this.notifyRemoveButtonClicked();
            event.stopPropagation();
            event.preventDefault();
            return false;
        });

        let inputWrapper = new DivEl('input-wrapper');
        this.appendChild(inputWrapper);

        inputWrapper.appendChild(this.inputElement);

        this.appendChild(this.removeButtonEl);

        this.refresh();
    }

    update(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void> {
        let property = propertyArray.get(this.inputOccurrence.getIndex());

        this.registerProperty(property);

        this.inputTypeView.updateInputOccurrenceElement(this.inputElement, property, unchangedOnly);

        return Q<void>(null);
    }

    reset() {
        this.inputTypeView.resetInputOccurrenceElement(this.inputElement);
    }

    setEnabled(enable: boolean) {
        this.inputTypeView.setEnabledInputOccurrenceElement(this.inputElement, enable);
        this.removeButtonEl.setEnabled(enable);
    }

    refresh() {

        if (this.inputOccurrence.oneAndOnly()) {
            this.addClass('single-occurrence').removeClass('multiple-occurrence');
        } else {
            this.addClass('multiple-occurrence').removeClass('single-occurrence');
        }

        this.removeButtonEl.setVisible(this.inputOccurrence.isRemoveButtonRequiredStrict());
    }

    getDataPath(): PropertyPath {

        return this.property.getPath();
    }

    getIndex(): number {
        return this.inputOccurrence.getIndex();
    }

    getInputElement(): Element {
        return this.inputElement;
    }

    hasValidUserInput(recording?: InputValidationRecording): boolean {
        return this.inputTypeView.hasInputElementValidUserInput(this.inputElement, recording);
    }

    giveFocus(): boolean {
        return this.inputElement.giveFocus();
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.inputElement.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.inputElement.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.inputElement.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.inputElement.unBlur(listener);
    }

    private initListeners() {
        let ignorePropertyChange = false;

        this.occurrenceValueChangedHandler = (occurrence: Element, value: Value) => {
            // check if this is our occurrence because all views will receive occurrence value changed event
            if (this.inputElement === occurrence) {
                if (InputOccurrenceView.debug) {
                    console.debug('InputOccurrenceView: onOccurrenceValueChanged ', occurrence, value);
                }
                ignorePropertyChange = true;
                this.property.setValue(value);
                this.inputTypeView.validate(false);
                ignorePropertyChange = false;
            }
        };

        this.onAdded(() => {
            this.inputTypeView.onOccurrenceValueChanged(this.occurrenceValueChangedHandler);
        });

        this.propertyValueChangedHandler = (event: PropertyValueChangedEvent) => {

            const changedProperty = event.getProperty();
            let newStateOfRequiredContractBroken = this.inputTypeView.valueBreaksRequiredContract(event.getNewValue());

            if (this.requiredContractBroken !== newStateOfRequiredContractBroken) {
                this.requiredContractBroken = newStateOfRequiredContractBroken;
                this.inputTypeView.notifyRequiredContractBroken();
            }

            if (!ignorePropertyChange) {
                if (InputOccurrenceView.debug) {
                    console.debug('InputOccurrenceView: propertyValueChanged', changedProperty);
                }
                this.inputTypeView.updateInputOccurrenceElement(this.inputElement, changedProperty, true);
            }
        };

        this.onRemoved(() => {
            if (this.property) {
                this.property.unPropertyValueChanged(this.propertyValueChangedHandler);
            }

            if (this.inputTypeView) {
                this.inputTypeView.unOccurrenceValueChanged(this.occurrenceValueChangedHandler);
            }
        });
    }

    private registerProperty(property: Property) {
        if (this.property) {
            if (InputOccurrenceView.debug) {
                console.debug('InputOccurrenceView.registerProperty: unregister old property', this.property);
            }
            this.property.unPropertyValueChanged(this.propertyValueChangedHandler);
        }
        if (property) {
            if (InputOccurrenceView.debug) {
                console.debug('InputOccurrenceView.registerProperty: register new property', property);
            }
            property.onPropertyValueChanged(this.propertyValueChangedHandler);
        }
        this.property = property;
    }
}
