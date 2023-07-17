import * as Q from 'q';
import {Property} from '../../../data/Property';
import {PropertyArray} from '../../../data/PropertyArray';
import {Value} from '../../../data/Value';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {Input} from '../../Input';
import {PropertyValueChangedEvent} from '../../../data/PropertyValueChangedEvent';
import {ValueChangedEvent} from '../ValueChangedEvent';
import {ClassHelper} from '../../../ClassHelper';
import {assertNotNull} from '../../../util/Assert';
import {BaseInputType} from './BaseInputType';
import {InputValidationRecording} from '../InputValidationRecording';

export abstract class BaseInputTypeSingleOccurrence
    extends BaseInputType {

    protected ignorePropertyChange: boolean;
    private property: Property;
    private propertyListener: (event: PropertyValueChangedEvent) => void;
    private inputValueChangedListeners: ((event: ValueChangedEvent) => void)[] = [];

    protected constructor(ctx: InputTypeViewContext, className?: string) {
        super(ctx, className);
        assertNotNull(ctx, 'CONTEXT cannot be null');

        this.initListeners();
    }

    public getContext(): InputTypeViewContext {
        return this.context;
    }

    isManagingAdd(): boolean {
        return true;
    }

    layout(input: Input, propertyArray: PropertyArray): Q.Promise<void> {
        return super.layout(input, propertyArray).then(() => {
            const property: Property = propertyArray.get(0);
            this.registerProperty(property);
            this.layoutProperty(input, this.property);

            return Q<void>(null);
        });
    }

    layoutProperty(_input: Input, _property: Property): Q.Promise<void> {
        throw new Error('Must be implemented by inheritor: ' + ClassHelper.getClassName(this));
    }

    update(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void> {
        let property = propertyArray.get(0);
        this.registerProperty(property);

        return this.updateProperty(this.property, unchangedOnly);
    }

    updateProperty(_property: Property, _unchangedOnly?: boolean): Q.Promise<void> {
        throw new Error('Must be implemented by inheritor: ' + ClassHelper.getClassName(this));
    }

    getProperty(): Property {
        return this.property;
    }

    validate(_silent: boolean = true) {
        this.previousValidationRecording = new InputValidationRecording(this.input.getOccurrences(), 1);
    }

    onValueChanged(listener: (event: ValueChangedEvent) => void) {
        this.inputValueChangedListeners.push(listener);
    }

    unValueChanged(listener: (event: ValueChangedEvent) => void) {
        this.inputValueChangedListeners = this.inputValueChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    onFocus(_listener: (_event: FocusEvent) => void) {
        throw new Error('Must be implemented by inheritor: ' + ClassHelper.getClassName(this));
    }

    unFocus(_listener: (_event: FocusEvent) => void) {
        throw new Error('Must be implemented by inheritor: ' + ClassHelper.getClassName(this));
    }

    onBlur(_listener: (_event: FocusEvent) => void) {
        throw new Error('Must be implemented by inheritor: ' + ClassHelper.getClassName(this));
    }

    unBlur(_listener: (_event: FocusEvent) => void) {
        throw new Error('Must be implemented by inheritor: ' + ClassHelper.getClassName(this));
    }

    protected registerProperty(property: Property) {
        if (this.property) {
            this.property.unPropertyValueChanged(this.propertyListener);
        }
        if (property) {
            property.onPropertyValueChanged(this.propertyListener);
        }
        this.property = property;
    }

    protected saveToProperty(value: Value) {
        this.ignorePropertyChange = true;
        this.property.setValue(value);
        this.validate(false);
        this.ignorePropertyChange = false;
    }

    protected notifyValueChanged(event: ValueChangedEvent) {
        this.inputValueChangedListeners.forEach((listener: (event: ValueChangedEvent) => void) => {
            listener(event);
        });
    }

    private initListeners() {
        this.propertyListener = (event: PropertyValueChangedEvent) => {
            if (!this.ignorePropertyChange) {
                this.updateProperty(event.getProperty(), true).done();
            }
        };

        this.onRemoved(() => {
            if (!!this.property) {
                this.property.unPropertyValueChanged(this.propertyListener);
            }
        });
    }
}
