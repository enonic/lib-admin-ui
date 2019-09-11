import * as Q from 'q';
import {Property} from '../../../data/Property';
import {PropertyArray} from '../../../data/PropertyArray';
import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {InputTypeView} from '../InputTypeView';
import {DivEl} from '../../../dom/DivEl';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {Input} from '../../Input';
import {PropertyValueChangedEvent} from '../../../data/PropertyValueChangedEvent';
import {InputValidityChangedEvent} from '../InputValidityChangedEvent';
import {ValueChangedEvent} from '../ValueChangedEvent';
import {Element} from '../../../dom/Element';
import {ClassHelper} from '../../../ClassHelper';
import {InputValidationRecording} from '../InputValidationRecording';
import {ContentSummary} from '../../../content/ContentSummary';
import {assertNotNull} from '../../../util/Assert';

export class BaseInputTypeSingleOccurrence
    extends DivEl
    implements InputTypeView {

    protected input: Input;
    protected ignorePropertyChange: boolean;
    private context: InputTypeViewContext;
    private property: Property;
    private propertyListener: (event: PropertyValueChangedEvent) => void;
    private inputValidityChangedListeners: { (event: InputValidityChangedEvent): void }[] = [];

    private inputValueChangedListeners: { (event: ValueChangedEvent): void }[] = [];

    constructor(ctx: InputTypeViewContext, className?: string) {
        super('input-type-view' + (className ? ' ' + className : ''));
        assertNotNull(ctx, 'CONTEXT cannot be null');
        this.context = ctx;

        this.initListeners();
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
        return true;
    }

    layout(input: Input, propertyArray: PropertyArray): Q.Promise<void> {
        let property = propertyArray.get(0);
        this.registerProperty(property);

        this.layoutProperty(input, this.property);
        return Q<void>(null);
    }

    layoutProperty(_input: Input, _property: Property): Q.Promise<void> {

        throw new Error('Must be implemented by inheritor: ' + ClassHelper.getClassName(this));
    }

    update(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void> {
        let property = propertyArray.get(0);
        this.registerProperty(property);

        return this.updateProperty(this.property, unchangedOnly);
    }

    reset() {
        throw Error('Must be implemented in inheritors');
    }

    refresh() {
        //to be implemented on demand in inheritors
    }

    updateProperty(_property: Property, _unchangedOnly?: boolean): Q.Promise<void> {
        throw new Error('Must be implemented by inheritor: ' + ClassHelper.getClassName(this));
    }

    getProperty(): Property {
        return this.property;
    }

    getValueType(): ValueType {
        throw new Error('Must be implemented by inheritor: ' + ClassHelper.getClassName(this));
    }

    newInitialValue(): Value {
        throw new Error('Must be implemented by inheritor: ' + ClassHelper.getClassName(this));
    }

    displayValidationErrors(_value: boolean) {
        // must be implemented by children
    }

    hasValidUserInput(): boolean {
        return true;
    }

    validate(_silent: boolean = true): InputValidationRecording {

        throw new Error('Must be implemented by inheritor: ' + ClassHelper.getClassName(this));
    }

    onValidityChanged(listener: (event: InputValidityChangedEvent) => void) {
        this.inputValidityChangedListeners.push(listener);
    }

    unValidityChanged(listener: (event: InputValidityChangedEvent) => void) {
        this.inputValidityChangedListeners.filter((currentListener: (event: InputValidityChangedEvent) => void) => {
            return listener === currentListener;
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

    onEditContentRequest(_listener: (content: ContentSummary) => void) {
        // Adapter for InputTypeView method, to be implemented on demand in inheritors
    }

    unEditContentRequest(_listener: (content: ContentSummary) => void) {
        // Adapter for InputTypeView method, to be implemented on demand in inheritors
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

    protected notifyValidityChanged(event: InputValidityChangedEvent) {
        this.inputValidityChangedListeners.forEach((listener: (event: InputValidityChangedEvent) => void) => {
            listener(event);
        });
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
