import * as Q from 'q';
import {PropertyArray} from '../../../data/PropertyArray';
import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {SelectedOptionEvent} from '../../../ui/selector/combobox/SelectedOptionEvent';
import {FocusSwitchEvent} from '../../../ui/FocusSwitchEvent';
import {InputTypeView} from '../InputTypeView';
import {DivEl} from '../../../dom/DivEl';
import {InputValidityChangedEvent} from '../InputValidityChangedEvent';
import {ValueChangedEvent} from '../ValueChangedEvent';
import {Input} from '../../Input';
import {InputValidationRecording} from '../InputValidationRecording';
import {Element} from '../../../dom/Element';
import {ClassHelper} from '../../../ClassHelper';
import {ContentSummary} from '../../../content/ContentSummary';

export class BaseInputTypeManagingAdd
    extends DivEl
    implements InputTypeView {

    public static debug: boolean = false;
    protected ignorePropertyChange: boolean;
    private inputValidityChangedListeners: { (event: InputValidityChangedEvent): void }[] = [];
    private inputValueChangedListeners: { (event: ValueChangedEvent): void }[] = [];
    private input: Input;
    private previousValidationRecording: InputValidationRecording;
    private layoutInProgress: boolean;
    private propertyArray: PropertyArray;
    private propertyArrayListener: () => void;

    constructor(className: string) {
        super('input-type-view' + (className ? ' ' + className : ''));

        this.initListeners();
    }

    availableSizeChanged() {
        // must be implemented by children
    }

    getElement(): Element {
        return this;
    }

    isManagingAdd(): boolean {
        return true;
    }

    getValueType(): ValueType {
        throw new Error('Must be implemented by inheritor: ' + ClassHelper.getClassName(this));
    }

    /**
     * Must be overridden by inheritors.
     */
    newInitialValue(): Value {
        throw new Error('Must be overridden by inheritor: ' + ClassHelper.getClassName(this));
    }

    /**
     * Must be resolved by inheritors.
     */
    layout(input: Input, propertyArray: PropertyArray): Q.Promise<void> {
        if (BaseInputTypeManagingAdd.debug) {
            console.log('BaseInputTypeManagingAdd.layout', input, propertyArray);
        }
        this.input = input;
        this.layoutInProgress = true;

        this.registerPropertyArray(propertyArray);

        return Q<void>(null);
    }

    /**
     * Must be resolved by inheritors.
     */
    update(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void> {
        if (BaseInputTypeManagingAdd.debug) {
            console.log('BaseInputTypeManagingAdd.update', propertyArray, unchangedOnly);
        }
        this.registerPropertyArray(propertyArray);

        return Q<void>(null);
    }

    reset() {
        throw Error('Must be implemented in inheritors');
    }

    refresh() {
        //to be implemented on demand in inheritors
    }

    hasValidUserInput(): boolean {
        return true;
    }

    displayValidationErrors(_value: boolean) {
        // must be implemented by children
    }

    validate(silent: boolean = true,
             rec: InputValidationRecording = null): InputValidationRecording {

        let recording = rec || new InputValidationRecording();

        if (this.layoutInProgress) {
            this.previousValidationRecording = recording;
            return recording;
        }

        let numberOfValids = this.getNumberOfValids();

        if (this.input.getOccurrences().minimumBreached(numberOfValids)) {
            recording.setBreaksMinimumOccurrences(true);
        }

        if (this.input.getOccurrences().maximumBreached(numberOfValids)) {
            recording.setBreaksMaximumOccurrences(true);
        }

        if (!silent && recording.validityChanged(this.previousValidationRecording)) {
            this.notifyValidityChanged(new InputValidityChangedEvent(recording, this.input.getName()));
        }

        this.previousValidationRecording = recording;
        return recording;
    }

    onValidityChanged(listener: (event: InputValidityChangedEvent) => void) {
        this.inputValidityChangedListeners.push(listener);
    }

    unValidityChanged(listener: (event: InputValidityChangedEvent) => void) {
        this.inputValidityChangedListeners.filter((currentListener: (event: InputValidityChangedEvent) => void) => {
            return listener === currentListener;
        });
    }

    notifyValidityChanged(event: InputValidityChangedEvent) {

        this.inputValidityChangedListeners.forEach((listener: (event: InputValidityChangedEvent) => void) => {
            listener(event);
        });
    }

    onValueChanged(listener: (event: ValueChangedEvent) => void) {
        this.inputValueChangedListeners.push(listener);
    }

    unValueChanged(listener: (event: ValueChangedEvent) => void) {
        this.inputValueChangedListeners = this.inputValueChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    /**
     * Must be overridden by inheritors.
     */
    giveFocus(): boolean {
        throw new Error('Must be overridden by inheritor: ' + ClassHelper.getClassName(this));
    }

    onEditContentRequest(_listener: (content: ContentSummary) => void) {
        // Have to use stub here because it doesn't extend BaseInputTypeView
    }

    unEditContentRequest(_listener: (content: ContentSummary) => void) {
        // Have to use stub here because it doesn't extend BaseInputTypeView
    }

    protected fireFocusSwitchEvent(event: SelectedOptionEvent<any>) {
        if (event.getKeyCode() === 13) {
            new FocusSwitchEvent(this).fire();
        }
    }

    protected getValueFromPropertyArray(propertyArray: PropertyArray): string {
        return propertyArray.getProperties().map((property) => {
            if (property.hasNonNullValue()) {
                return property.getString();
            }
        }).join(';');
    }

    protected notifyValueChanged(event: ValueChangedEvent) {
        this.inputValueChangedListeners.forEach((listener: (event: ValueChangedEvent) => void) => {
            listener(event);
        });
    }

    protected getInput(): Input {
        return this.input;
    }

    protected getNumberOfValids(): number {
        throw new Error('Must be overridden by inheritor: ' + ClassHelper.getClassName(this));
    }

    protected isLayoutInProgress(): boolean {
        return this.layoutInProgress;
    }

    protected setLayoutInProgress(layoutInProgress: boolean) {
        this.layoutInProgress = layoutInProgress;
    }

    protected getPropertyArray(): PropertyArray {
        return this.propertyArray;
    }

    private initListeners() {
        this.propertyArrayListener = (...args: any[]) => {
            if (!this.ignorePropertyChange) {
                if (BaseInputTypeManagingAdd.debug) {
                    console.debug('BaseInputTypeManagingAdd: propertyArrayListener', args);
                }
                this.update(this.propertyArray, true).done();
            }
        };

        this.onRemoved(() => {
            if (this.propertyArray) {
                this.removePropertyArrayListeners();
            }
        });
    }

    private registerPropertyArray(propertyArray: PropertyArray) {
        if (this.propertyArray) {
            if (BaseInputTypeManagingAdd.debug) {
                console.debug('BaseInputTypeManagingAdd.registerPropertyArray: unregister old first ', this.propertyArray);
            }
            this.removePropertyArrayListeners();
        }
        if (propertyArray) {
            if (BaseInputTypeManagingAdd.debug) {
                console.debug('BaseInputTypeManagingAdd.registerPropertyArray: register new one ', propertyArray);
            }
            this.ensureOccurrenceLimits(propertyArray);

            propertyArray.onPropertyValueChanged(this.propertyArrayListener);
            propertyArray.onPropertyAdded(this.propertyArrayListener);
            propertyArray.onPropertyRemoved(this.propertyArrayListener);
            propertyArray.onPropertyIndexChanged(this.propertyArrayListener);
        }
        this.propertyArray = propertyArray;
    }

    private removePropertyArrayListeners() {
        this.propertyArray.unPropertyValueChanged(this.propertyArrayListener);
        this.propertyArray.unPropertyAdded(this.propertyArrayListener);
        this.propertyArray.unPropertyRemoved(this.propertyArrayListener);
        this.propertyArray.unPropertyIndexChanged(this.propertyArrayListener);
    }

    private ensureOccurrenceLimits(propertyArray: PropertyArray) {

        let max = this.input.getOccurrences().getMaximum();
        let actual = propertyArray.getSize();

        if (max > 0 && max < actual) {
            if (BaseInputTypeManagingAdd.debug) {
                console.info(`BaseInputTypeManagingAdd: expected max ${max} occurrences, but found ${actual}, dropping extra`);
            }
            for (let i = actual - 1; i > max - 1; i--) {
                propertyArray.remove(i);
            }
        }
    }
}
