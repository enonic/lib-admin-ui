import {PropertySet} from './PropertySet';
import {PropertyArray} from './PropertyArray';
import {PropertyPath, PropertyPathElement} from './PropertyPath';
import {Value} from './Value';
import {BinaryReference} from '../util/BinaryReference';
import {Reference} from '../util/Reference';
import {GeoPoint} from '../util/GeoPoint';
import {LocalTime} from '../util/LocalTime';
import {LocalDateTime} from '../util/LocalDateTime';
import {LocalDate} from '../util/LocalDate';
import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';
import {StringHelper} from '../util/StringHelper';
import {PropertyValueChangedEvent} from './PropertyValueChangedEvent';
import {assertNotNull} from '../util/Assert';
import {ValueTypes} from './ValueTypes';
import {ValueType} from './ValueType';
import {DateTime} from '../util/DateTime';

/**
 * A Property has a [[name]] and a [[value]],
 * but also:
 * *  an [[index]], since it's a part of an [[array]]
 * *  a [[parent]], since it's also a part of a [[PropertySet]]
 *
 * A Property is mutable, both it's [[index]] and [[value]] can change.
 */
export class Property
    implements Equitable {

    public static debug: boolean = false;

    private parent: PropertySet;

    private array: PropertyArray;

    private name: string;

    private index: number;

    private value: Value;

    private propertyValueChangedListeners: ((event: PropertyValueChangedEvent) => void)[] = [];

    constructor(builder: PropertyBuilder) {
        assertNotNull(builder.array, 'array of a Property cannot be null');
        assertNotNull(builder.name, 'name of a Property cannot be null');
        assertNotNull(builder.index, 'index of a Property cannot be null');
        assertNotNull(builder.value, 'value of a Property cannot be null');

        this.array = builder.array;
        this.parent = builder.array.getParent();
        this.name = builder.name;
        this.index = builder.index;
        this.value = builder.value;

        if (this.value.getType().equals(ValueTypes.DATA) && this.value.isNotNull()) {
            let valuePropertySet = this.value.getPropertySet();
            valuePropertySet.setContainerProperty(this);
        }
    }

    public static checkName(name: string) {
        if (name == null) {
            throw new Error('Property name cannot be null');
        }
        if (StringHelper.isBlank(name)) {
            throw new Error('Property name cannot be blank');
        }
        if (name.indexOf('.') >= 0) {
            throw new Error('Property name cannot contain .');
        }
        if (name.indexOf('[') >= 0 || name.indexOf(']') >= 0) {
            throw new Error('Property name cannot contain [ or ]');
        }
    }

    public static create(): PropertyBuilder {
        return new PropertyBuilder();
    }

    /**
     * Change the index.
     *
     * A [[PropertyIndexChangedEvent]] will be notified to listeners if the index really changed.
     * @param newIndex
     */
    setIndex(newIndex: number) {
        this.index = newIndex;
    }

    /**
     * Change the value.
     *
     * A [[PropertyValueChangedEvent]] will be notified to listeners if the value really changed.
     * @param value
     */
    setValue(value: Value, force: boolean = false) {
        assertNotNull(value, 'value of a Property cannot be null');
        let oldValue = this.value;
        this.value = value;

        // Register listeners on PropertySet
        if (this.value.getType().equals(ValueTypes.DATA) && this.value.isNotNull()) {
            let propertySet = this.value.getPropertySet();
            propertySet.setContainerProperty(this);
            this.array.registerPropertySetListeners(propertySet);
        }

        // Unregister listeners on PropertySet from oldValue
        if (oldValue.getType().equals(ValueTypes.DATA) && oldValue.isNotNull()) {
            let removedPropertySet = oldValue.getPropertySet();
            removedPropertySet.setContainerProperty(null);
            this.array.unregisterPropertySetListeners(removedPropertySet);
        }

        if (!value.equals(oldValue)) {
            this.notifyPropertyValueChangedEvent(oldValue, value, force);
        }
    }

    convertValueType(type: ValueType, converter: (value: Value, toType: ValueType) => Value) {
        this.array.convertValues(type, converter);
    }

    /**
     * Detach this Property from it's array and parent. Should be called when removed from the array.
     */
    detach() {
        if (this.getType().equals(ValueTypes.DATA)) {

            this.getPropertySet().setContainerProperty(null);
            this.array.unregisterPropertySetListeners(this.getPropertySet());
        }
        this.array = null;
        this.parent = null;
        this.propertyValueChangedListeners = [];
    }

    reset() {
        if (!this.hasNullValue()) {
            if (this.getType().equals(ValueTypes.DATA)) {
                this.getPropertySet().reset();
            } else {
                this.setValue(this.getType().newNullValue());
            }
        }
    }

    getParent(): PropertySet {
        return this.parent;
    }

    hasParentProperty(): boolean {
        return !!this.getParentProperty();
    }

    getParentProperty(): Property {
        return this.parent.getProperty();
    }

    getPath(): PropertyPath {
        if (this.hasParentProperty()) {
            return PropertyPath.fromParent(this.getParentProperty().getPath(), new PropertyPathElement(this.name, this.index));
        } else {
            return PropertyPath.fromPathElement(new PropertyPathElement(this.name, this.index));
        }
    }

    getName(): string {
        return this.name;
    }

    getIndex(): number {
        return this.index;
    }

    getType(): ValueType {
        return this.value.getType();
    }

    getValue(): Value {
        return this.value;
    }

    hasNullValue(): boolean {
        return this.value.isNull();
    }

    hasNonNullValue(): boolean {
        return !this.value.isNull();
    }

    getPropertySet(): PropertySet {
        return this.value.getPropertySet();
    }

    getString(): string {
        return this.value.getString();
    }

    getLong(): number {
        return this.value.getLong();
    }

    getDouble(): number {
        return this.value.getDouble();
    }

    getBoolean(): boolean {
        return this.value.getBoolean();
    }

    getDateTime(): DateTime {
        return this.value.getDateTime();
    }

    getLocalDate(): LocalDate {
        return this.value.getLocalDate();
    }

    getLocalDateTime(): LocalDateTime {
        return this.value.getLocalDateTime();
    }

    getLocalTime(): LocalTime {
        return this.value.getLocalTime();
    }

    getGeoPoint(): GeoPoint {
        return this.value.getGeoPoint();
    }

    getReference(): Reference {
        return this.value.getReference();
    }

    getBinaryReference(): BinaryReference {
        return this.value.getBinaryReference();
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, Property)) {
            return false;
        }

        let other = o as Property;

        if (!ObjectHelper.stringEquals(this.name, other.name)) {
            return false;
        }

        if (!ObjectHelper.numberEquals(this.index, other.index)) {
            return false;
        }

        if (!ObjectHelper.equals(this.value, other.value)) {
            return false;
        }

        return true;
    }

    copy(destinationPropertyArray: PropertyArray) {

        let value: Value;

        if (ValueTypes.DATA.isPropertySet(this.value) && this.value.isNotNull()) {
            let destinationTree = destinationPropertyArray.getTree();
            let copiedPropertySet = this.value.getPropertySet().copy(destinationTree);
            value = new Value(copiedPropertySet, ValueTypes.DATA);
        } else {
            value = this.value;
        }

        return Property.create().setName(this.name).setValue(value).setIndex(this.index).setArray(destinationPropertyArray).build();
    }

    onPropertyValueChanged(listener: (event: PropertyValueChangedEvent) => void) {
        this.propertyValueChangedListeners.push(listener);
    }

    unPropertyValueChanged(listener: (event: PropertyValueChangedEvent) => void) {
        this.propertyValueChangedListeners =
            this.propertyValueChangedListeners.filter((curr) => (curr !== listener));
    }

    private notifyPropertyValueChangedEvent(previousValue: Value, newValue: Value, force: boolean = false): void {
        let event = new PropertyValueChangedEvent(this, previousValue, newValue, force);
        if (Property.debug) {
            console.debug('Property[' + this.getPath().toString() + '].notifyPropertyValueChangedEvent: ' + event.toString());
        }
        this.propertyValueChangedListeners.forEach((listener) => listener(event));
    }
}

export class PropertyBuilder {

    array: PropertyArray;

    name: string;

    index: number;

    value: Value;

    setArray(value: PropertyArray): PropertyBuilder {
        this.array = value;
        return this;
    }

    setName(value: string): PropertyBuilder {
        this.name = value;
        return this;
    }

    setIndex(value: number): PropertyBuilder {
        this.index = value;
        return this;
    }

    setValue(value: Value): PropertyBuilder {
        this.value = value;
        return this;
    }

    build(): Property {
        return new Property(this);
    }
}
