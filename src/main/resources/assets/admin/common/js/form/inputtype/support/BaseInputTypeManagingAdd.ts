import * as Q from 'q';
import {PropertyArray} from '../../../data/PropertyArray';
import {SelectedOptionEvent} from '../../../ui/selector/combobox/SelectedOptionEvent';
import {FocusSwitchEvent} from '../../../ui/FocusSwitchEvent';
import {InputValidityChangedEvent} from '../InputValidityChangedEvent';
import {ValueChangedEvent} from '../ValueChangedEvent';
import {Input} from '../../Input';
import {InputValidationRecording} from '../InputValidationRecording';
import {ClassHelper} from '../../../ClassHelper';
import {BaseInputType} from './BaseInputType';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {ValidationError} from '../../../ValidationError';
import {FormItemPath} from '../../FormItemPath';

export abstract class BaseInputTypeManagingAdd
    extends BaseInputType {

    public static debug: boolean = false;
    private inputValueChangedListeners: ((event: ValueChangedEvent) => void)[] = [];
    private layoutInProgress: boolean;
    private propertyArray: PropertyArray;
    private propertyArrayListener: () => void;

    protected constructor(context: InputTypeViewContext, className?: string) {
        super(context, className);

        this.initListeners();
    }

    isManagingAdd(): boolean {
        return true;
    }

    /**
     * Must be resolved by inheritors.
     */
    layout(input: Input, propertyArray: PropertyArray): Q.Promise<void> {
        this.layoutInProgress = true;

        return super.layout(input, propertyArray).then(() => {
            if (BaseInputTypeManagingAdd.debug) {
                console.log('BaseInputTypeManagingAdd.layout', input, propertyArray);
            }

            this.registerPropertyArray(propertyArray);

            return Q<void>(null);
        });
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

    validate(silent: boolean = true) {
        if (this.layoutInProgress) {
            return;
        }

        const recording: InputValidationRecording = this.doValidate();

        this.addCustomValidation(recording);

        if (!silent && recording.validityChanged(this.previousValidationRecording)) {
            this.notifyValidityChanged(new InputValidityChangedEvent(recording));
        }

        this.previousValidationRecording = recording;
    }

    private addCustomValidation(recording: InputValidationRecording): void {
        if (this.context.formContext?.getFormState()?.isNew()) {
            return;
        }

        const customValidationError: ValidationError = this.getCustomError();

        if (customValidationError) {
            recording.setErrorMessage(customValidationError.getMessage());
        }
    }

    private getCustomError(): ValidationError {
        if (!this.context.formContext.hasValidationErrors()) {
            return null;
        }

        const inputPath: FormItemPath = this.input.getPath();
        const inputPathAsString: string = inputPath.isAbsolute() ? inputPath.toString().substring(1) : inputPath.toString();

        return this.context.formContext.getValidationErrors().find((error: ValidationError) => {
            return error.getPropertyPath() === inputPathAsString;
        });
    }

    handleValueChanged(silent: boolean = true): void {
        this.cleanCustomValidationErrors();
        this.validate(silent);
    }

    private cleanCustomValidationErrors(): void {
        const customValidationError: ValidationError = this.getCustomError();

        if (customValidationError) {
            this.removeCustomValidationError(customValidationError);
        }
    }

    private removeCustomValidationError(errorToRemove: ValidationError): void {
        const customValidationErrors: ValidationError[] = this.context.formContext.getValidationErrors();
        const newCustomValidationErrors: ValidationError[] =
            customValidationErrors.filter((error: ValidationError) => error !== errorToRemove);
        this.context.formContext.setValidationErrors(newCustomValidationErrors);
    }

    protected doValidate(): InputValidationRecording {
        const totalValid: number = this.getNumberOfValids();
        const recording: InputValidationRecording = new InputValidationRecording(this.input.getOccurrences(), totalValid);

        return recording;
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

    protected fireFocusSwitchEvent(event: SelectedOptionEvent<any>) {
        if (event.getKeyCode() === 13) {
            new FocusSwitchEvent(this).fire();
        }
    }

    protected getValueFromPropertyArray(propertyArray: PropertyArray): string {
        return propertyArray.getProperties().map((property) => {
            return property.hasNonNullValue() ? property.getString() : '';
        }).join(';');
    }

    protected notifyValueChanged(event: ValueChangedEvent) {
        this.inputValueChangedListeners.forEach((listener: (event: ValueChangedEvent) => void) => {
            listener(event);
        });
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

    protected ignorePropertyChange(value: boolean) {
        this.propertyArray.setIgnoreChange(value);
    }

    protected isPropertyChangeIgnored(): boolean {
        return this.propertyArray.getIgnoreChange();
    }

    private initListeners() {
        this.propertyArrayListener = (...args: any[]) => {
            if (!this.isPropertyChangeIgnored()) {
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
