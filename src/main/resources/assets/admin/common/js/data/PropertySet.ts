import {Reference} from '../util/Reference';
import {BinaryReference} from '../util/BinaryReference';
import {GeoPoint} from '../util/GeoPoint';
import {LocalTime} from '../util/LocalTime';
import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';
import {ValueTypes} from './ValueTypes';
import {LocalDate} from '../util/LocalDate';
import {LocalDateTime} from '../util/LocalDateTime';
import {DateTime} from '../util/DateTime';
import {PropertyEvent} from './PropertyEvent';
import {PropertyAddedEvent} from './PropertyAddedEvent';
import {PropertyRemovedEvent} from './PropertyRemovedEvent';
import {PropertyValueChangedEvent} from './PropertyValueChangedEvent';
import {PropertyTree, PropertyTreeDiff} from './PropertyTree';
import {PropertyArray} from './PropertyArray';
import {Property} from './Property';
import {assert, assertState} from '../util/Assert';
import {Value} from './Value';
import {PropertyPath} from './PropertyPath';
import {PropertyArrayJson} from './PropertyArrayJson';
import {ValueType} from './ValueType';
import {ValueTypePropertySet} from './ValueTypePropertySet';
import {Typable} from './Typable';
import {PropertyMovedEvent} from './PropertyMovedEvent';

/**
 * A PropertySet manages a set of properties. The properties are grouped in arrays by name ([[Property.name]]).
 *
 * The PropertySet provides several functions for both creation, updating and getting property values of a certain type (see [[ValueTypes]]).
 * Instead of repeating the documentation for each type, here is an overview of the functions which exists for each [[ValueType]]
 * (replace Xxx with one of the value types).
 *
 * * addXxx(name, value) : Property
 * > Creates a new property with the given name and value, and adds it to this PropertySet.
 * Returns the added property.
 *
 * * addXxxs(name: string, values:Xxx[]) : Property[]
 * > Creates new properties with the given name and values, and adds them to this PropertySet.
 * Returns an array of the added properties.
 *
 * * setXxx(name: string, value: Xxx, index: number) : Property
 * > On the root PropertySet: In this PropertySet; creates a new property with given name, index and value or updates existing with given value.
 * Returns the created or updated property.
 *
 * * setXxxByPath(path: any, value: Xxx) : Property
 * > Creates a new property at given path (relative to this PropertySet) with given value or updates existing with given value. path can either be a string or [[PropertyPath]].
 * Returns the created or updated property.
 *
 * * getXxx(identifier: string, index: number): Xxx
 * > Gets a property value of type Xxx with given identifier and optional index. If index is given, then the identifier is understood
 *  as the name of the property and it will be retrieved from this PropertySet. If the index is omitted the identifier is understood
 *  as a relative path (to this PropertySet) of the property.
 *
 * * getXxxs(name: string): Xxx[]
 * > Gets property values of type Xxx with the given name. Returns an array of type Xxx.
 *
 *
 * @see [[PropertyArray]]
 * @see [[Property]]
 */
export class PropertySet
    implements Equitable, Typable {

    public static debug: boolean = false;

    private tree: PropertyTree = null;

    /**
     * The property that this PropertySet is the value of.
     * Required to be set, except for the root PropertySet of a PropertyTree where it will always be null.
     */
    private property: Property = null;

    private propertyArrayByName: Record<string, PropertyArray> = {};

    /**
     * If true, do not add property if it's value is null.
     */
    private skipNulls: boolean = false;

    private changedListeners: ((event: PropertyEvent) => void)[] = [];

    private propertyAddedListeners: ((event: PropertyAddedEvent) => void)[] = [];

    private propertyRemovedListeners: ((event: PropertyRemovedEvent) => void)[] = [];

    private propertyMovedListeners: ((event: PropertyMovedEvent) => void)[] = [];

    private propertyValueChangedListeners: ((event: PropertyValueChangedEvent) => void)[] = [];

    private propertyAddedEventHandler: (event: PropertyAddedEvent) => void;

    private propertyRemovedEventHandler: (event: PropertyRemovedEvent) => void;

    private propertyMovedEventHandler: (event: PropertyMovedEvent) => void;

    private propertyValueChangedEventHandler: (event: PropertyValueChangedEvent) => void;

    constructor(tree?: PropertyTree) {
        this.tree = tree;

        this.propertyAddedEventHandler = (event) => {
            this.forwardPropertyAddedEvent(event);
        };
        this.propertyRemovedEventHandler = (event) => {
            this.forwardPropertyRemovedEvent(event);
        };
        this.propertyMovedEventHandler = (event) => {
            this.forwardPropertyMovedEvent(event);
        };
        this.propertyValueChangedEventHandler = (event) => {
            this.forwardPropertyValueChangedEvent(event);
        };
    }

    /**
     * Application protected. Not to be used outside module.
     */
    setContainerProperty(value: Property) {
        this.property = value;
    }

    /**
     * Whether this PropertySet is attached to a [[PropertyTree]] or not.
     * @returns {boolean} true if it's not attached to a [[PropertyTree]].
     */
    isDetached(): boolean {
        return !this.tree;
    }

    getTree(): PropertyTree {
        return this.tree;
    }

    getType(): ValueTypePropertySet {
        return ValueTypes.DATA;
    }

    /**
     * Application protected. Not to be used outside module.
     */
    attachToTree(tree: PropertyTree) {
        this.tree = tree;

        this.forEach((property: Property) => {
            if (property.hasNonNullValue() && property.getType().equals(ValueTypes.DATA)) {
                property.getPropertySet().attachToTree(tree);
            }
        });
    }

    addPropertyArray(array: PropertyArray) {
        assertState(this.tree === array.getTree(),
            'Added PropertyArray must be attached to the same PropertyTree as this PropertySet');
        assert(this === array.getParent(), 'propertyArray must have this PropertySet as parent');
        this.propertyArrayByName[array.getName()] = array;

        this.registerPropertyArrayListeners(array);

        array.getProperties().forEach((property) => {
            this.forwardPropertyAddedEvent(new PropertyAddedEvent(property));
        });
    }

    addProperty(name: string, value: Value): Property {

        if (this.skipNulls && value.isNull()) {
            this.skipNulls = false;
            return null;
        }

        let array = this.getOrCreatePropertyArray(name, value.getType());
        let property = array.add(value);
        return property;
    }

    setPropertyByPath(path: any, value: Value): Property {
        if (ObjectHelper.iFrameSafeInstanceOf(path, PropertyPath)) {
            return this.doSetProperty(path as PropertyPath, value);
        } else {
            return this.doSetProperty(PropertyPath.fromString(path.toString()), value);
        }
    }

    setProperty(name: string, index: number, value: Value): Property {

        let array = this.getOrCreatePropertyArray(name, value.getType());
        return array.set(index, value);
    }

    removeProperties(properties: Property[]) {
        properties.forEach((property) => {
            this.removeProperty(property.getName(), property.getIndex());
        });
    }

    removeProperty(name: string, index: number) {
        let array: PropertyArray = this.propertyArrayByName[name];
        if (array) {
            array.remove(index);
        }
        if (!array || array.isEmpty()) {
            delete this.propertyArrayByName[name];
        }
    }

    removeAllProperties() {
        for (const name in this.propertyArrayByName) {
            if (this.propertyArrayByName.hasOwnProperty(name)) {
                let propertyArray: PropertyArray = this.propertyArrayByName[name];
                for (let i = 0; i < propertyArray.getSize(); i++) {
                    propertyArray.remove(i);
                }
                delete this.propertyArrayByName[name];
            }
        }
    }

    isEmpty(): boolean {
        let isEmpty: boolean = true;
        for (const name in this.propertyArrayByName) {
            if (this.propertyArrayByName.hasOwnProperty(name)) {
                let propertyArray: PropertyArray = this.propertyArrayByName[name];
                propertyArray.forEach((property: Property) => {
                    if (!isEmpty) {
                        return;
                    }
                    let type = property.getType();
                    if (property.hasNullValue()) {
                        return;
                    }
                    if (type.equals(ValueTypes.STRING) && property.getValue().getString() === '') {
                        return;
                    }
                    if (type.equals(ValueTypes.BOOLEAN) && property.getValue().getBoolean() === false) {
                        return;
                    }
                    if (type.equals(ValueTypes.DATA) && property.getValue().getPropertySet().isEmpty()) {
                        return;
                    }
                    isEmpty = false;
                });
                if (!isEmpty) {
                    return false;
                }
            }
        }
        return true;
    }

    removeEmptyValues() {
        this.doRemoveEmptyValues(this);
    }

    removeEmptySets() {
        this.doRemoveEmptyArrays(this);
    }

    /**
     * Returns the number of child properties in this PropertySet (grand children and so on is not counted).
     */
    getSize(): number {
        let size = 0;
        ObjectHelper.objectPropertyIterator(this.propertyArrayByName, (_name: string, propertyArray: PropertyArray) => {
            size += propertyArray.getSize();
        });

        return size;
    }

    /**
     * Counts the number of child properties having the given name (grand children and so on is not counted).
     */
    countProperties(name: string): number {
        let array = this.propertyArrayByName[name];
        if (!array) {
            return 0;
        }
        return array.getSize();
    }

    /**
     * @returns {PropertyPath} The [[PropertyPath]] that this PropertySet is a value of.
     */
    getPropertyPath(): PropertyPath {
        return !this.property ? PropertyPath.ROOT : this.property.getPath();
    }

    /**
     * * getProperty() - If no arguments are given then this PropertySet's Property is returned.
     * * getProperty(name: string, index: number) - If name and index are given then property with that name and index is returned.
     * * getProperty(path: string) - If a path as string is given then property with that path is returned.
     * * getProperty(path: PropertyPath ) - If a path as [[PropertyPath]] is given then property with that path is returned.
     *
     * @param identifier
     * @param index
     * @returns {Property}
     */
    getProperty(identifier?: any, index?: number): Property {

        if (identifier == null && index == null) {
            return this.property;
        } else if (index != null) {
            Property.checkName(identifier);
            let array = this.propertyArrayByName[identifier];
            if (!array) {
                return null;
            }
            return array.get(index);
        } else {
            return this.getPropertyByPath(identifier);
        }
    }

    getPropertyArray(name: string): PropertyArray {
        return this.propertyArrayByName[name];
    }

    getPropertyArrays(): PropertyArray[] {
        const arrays = [];

        for (const name in this.propertyArrayByName) {
            if (this.propertyArrayByName.hasOwnProperty(name)) {
                const array = this.getPropertyArray(name);
                if (array) {
                    arrays.push(array);
                }
            }
        }
        return arrays;
    }

    /**
     * Calls the given callback for each property in the set.
     */
    forEach(callback: (property: Property, index?: number) => void) {
        ObjectHelper.objectPropertyIterator(this.propertyArrayByName, (_name: string, propertyArray: PropertyArray) => {
            propertyArray.forEach((property: Property, index: number) => {
                callback(property, index);
            });
        });
    }

    reset() {
        this.forEach((property: Property) => {
            property.reset();
        });
    }

    /**
     * Calls the given callback for each property with the given name.
     */
    forEachProperty(propertyName: string, callback: (property: Property, index?: number) => void) {
        let array = this.getPropertyArray(propertyName);
        if (array) {
            array.forEach(callback);
        }
    }

    public isNotNull(identifier: any, index?: number): boolean {
        let property = this.getProperty(identifier, index);
        if (property == null) {
            return false;
        }

        return !property.hasNullValue();
    }

    public isNull(identifier: any, index?: number): boolean {
        return !this.isNotNull(identifier, index);
    }

    public equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, PropertySet)) {
            return false;
        }

        let other = o as PropertySet;

        if (!ObjectHelper.objectMapEquals(this.propertyArrayByName, other.propertyArrayByName)) {
            return false;
        }

        return true;
    }

    public syncEmptyArrays(target: PropertySet) {

        if (!target) {
            return;
        }

        target.getPropertyArrays().forEach((propertyArray: PropertyArray) => {
            if (!this.getPropertyArray(propertyArray.getName())) {

                this.addPropertyArray(propertyArray.copy(this));
            }

            const thisPropertyArray = this.getPropertyArray(propertyArray.getName());

            propertyArray.forEach(((property, index) => {
                if (property.getType().equals(ValueTypes.DATA)) {

                    const targetPropertySet = property.getPropertySet();
                    const thisPropertySet = thisPropertyArray.getSet(index);

                    if (thisPropertySet) {
                        thisPropertySet.syncEmptyArrays(targetPropertySet);
                    }
                }
            }));
        });
    }

    public diff(other: PropertySet): PropertyTreeDiff {
        let checkedProperties: string[] = [];
        let diff = this.doDiff(other, checkedProperties);
        // run inverse diff to find properties, which were added to the original set
        let inverseDiff = other.doDiff(this, checkedProperties);

        diff.added = diff.added.concat(inverseDiff.removed);

        return diff;
    }

    /**
     * Copies this PropertySet (deep copy).
     * @param destinationTree The [[PropertyTree]] that the copied PropertySet will be attached to.
     * @returns {PropertySet}
     */
    copy(destinationTree: PropertyTree): PropertySet {

        let copy = new PropertySet(destinationTree);

        ObjectHelper.objectPropertyIterator(this.propertyArrayByName, (_name: string, sourcePropertyArray: PropertyArray) => {
            let propertyArrayCopy = sourcePropertyArray.copy(copy);
            copy.addPropertyArray(propertyArrayCopy);
        });

        return copy;
    }

    addPropertiesFromSet(sourceSet: PropertySet): PropertySet {
        ObjectHelper.objectPropertyIterator(sourceSet.propertyArrayByName, (_name: string, sourcePropertyArray: PropertyArray) => {
            let propertyArrayCopy = sourcePropertyArray.copy(this);
            this.addPropertyArray(propertyArrayCopy);
        });

        return this;
    }

    toJson(): PropertyArrayJson[] {
        let jsonArray: PropertyArrayJson[] = [];

        ObjectHelper.objectPropertyIterator(this.propertyArrayByName, (_name: string, propertyArray: PropertyArray) => {
            jsonArray.push(propertyArray.toJson());
        });

        return jsonArray;
    }

    getValuesAsString(): { name: string; value: string; path: string }[] {
        let result = [];

        ObjectHelper.objectPropertyIterator(this.propertyArrayByName, (name: string, propertyArray: PropertyArray) => {
            if (name === '_selected') { // this is a "hidden" property from an OptionSet which we don't need
                return;
            }
            if (propertyArray.getType().equals(ValueTypes.DATA)) {
                propertyArray.forEach((property: Property) => {
                    result = result.concat(property.getValue().getPropertySet().getValuesAsString());
                });
            } else if (!propertyArray.isEmpty()) {
                const property = propertyArray.get(0);
                const value = property.getValue() || ValueTypes.STRING.newNullValue();
                result.push({
                    name: name,
                    value: value.isNull() ? '' : value.getString(),
                    path: property.getPath().toString().substr(1)
                });
            }
        });

        return result;
    }

    onChanged(listener: (event: PropertyEvent) => void) {
        this.changedListeners.push(listener);
    }

    unChanged(listener: (event: PropertyEvent) => void) {
        this.changedListeners = this.changedListeners.filter((curr) => (curr !== listener));
    }

    /**
     * Register a listener-function to be called when a [[Property]] has been added to this PropertySet or any below.
     * @param listener
     * @see [[PropertyAddedEvent]]
     */
    onPropertyAdded(listener: (event: PropertyAddedEvent) => void) {
        this.propertyAddedListeners.push(listener);
    }

    /**
     * Deregister a listener-function.
     * @param listener
     * @see [[PropertyAddedEvent]]
     */
    unPropertyAdded(listener: (event: PropertyAddedEvent) => void) {
        this.propertyAddedListeners = this.propertyAddedListeners.filter((curr) => (curr !== listener));
    }

    /**
     * Register a listener-function to be called when a [[Property]] has been removed from this PropertySet or any below.
     * @param listener
     * @see [[PropertyRemovedEvent]]
     */
    onPropertyRemoved(listener: (event: PropertyRemovedEvent) => void) {
        this.propertyRemovedListeners.push(listener);
    }

    /**
     * Deregister a listener-function.
     * @param listener
     * @see [[PropertyRemovedEvent]]
     */
    unPropertyRemoved(listener: (event: PropertyRemovedEvent) => void) {
        this.propertyRemovedListeners = this.propertyRemovedListeners.filter((curr) => (curr !== listener));
    }

    /**
     * Register a listener-function to be called when the [[Property.index]] in this this PropertySet or any below has changed.
     * @param listener
     * @see [[PropertyRemovedEvent]]
     */
    onPropertyMoved(listener: (event: PropertyMovedEvent) => void) {
        this.propertyMovedListeners.push(listener);
    }

    /**
     * Deregister a listener-function.
     * @param listener
     * @see [[PropertyIndexChangedEvent]]
     */
    unPropertyMoved(listener: (event: PropertyMovedEvent) => void) {
        this.propertyMovedListeners = this.propertyMovedListeners.filter((curr) => (curr !== listener));
    }

    /**
     * Register a listener-function to be called when the [[Property.value]] in this this PropertySet or any below has changed.
     * @param listener
     * @see [[PropertyValueChangedEvent]]
     */
    onPropertyValueChanged(listener: (event: PropertyValueChangedEvent) => void) {
        this.propertyValueChangedListeners.push(listener);
    }

    /**
     * Deregister a listener-function.
     * @param listener
     * @see [[PropertyValueChangedEvent]]
     */
    unPropertyValueChanged(listener: (event: PropertyValueChangedEvent) => void) {
        this.propertyValueChangedListeners = this.propertyValueChangedListeners.filter((curr) => (curr !== listener));
    }

    /**
     * Creates a new PropertySet attached to the same [[PropertyTree]] as this PropertySet.
     * The PropertySet is not added to the tree.
     * @returns {PropertySet}
     */
    newSet(): PropertySet {
        if (!this.tree) {

            throw new Error(
                `The PropertySet must be attached to a PropertyTree before this method can be invoked.
 Use PropertySet constructor with no arguments instead.`);
        }
        return this.tree.newPropertySet();
    }

    /**
     * Creates
     * @param name
     * @param value optional
     * @returns {PropertySet}
     */
    addPropertySet(name: string, value?: PropertySet): PropertySet {
        if (!value) {
            if (!this.tree) {

                throw new Error(
                    `The PropertySet must be attached to a PropertyTree before this method can be invoked.
 Use PropertySet constructor with no arguments instead.`);
            }
            value = this.tree.newPropertySet();
        }
        this.addProperty(name, new Value(value, ValueTypes.DATA));
        return value;
    }

    setPropertySet(name: string, index: number, value: PropertySet): Property {
        return this.setProperty(name, index, new Value(value, ValueTypes.DATA));
    }

    setPropertySetByPath(path: any, value: PropertySet): Property {
        return this.setPropertyByPath(path, new Value(value, ValueTypes.DATA));
    }

    getPropertySet(identifier: any, index?: number): PropertySet {
        let property = this.getProperty(identifier, index);
        return !property ? null : property.getPropertySet();
    }

    getPropertySets(name: string): PropertySet[] {
        let values: PropertySet[] = [];
        let array = this.getPropertyArray(name);
        if (array) {
            array.forEach((property: Property) => {
                values.push(property.getPropertySet());
            });
        }
        return values;
    }

    addString(name: string, value: string): Property {
        return this.addProperty(name, new Value(value, ValueTypes.STRING));
    }

    addStrings(name: string, values: string[]): Property[] {

        let properties: Property[] = [];
        values.forEach((value: string) => {
            properties.push(this.addString(name, value));
        });
        return properties;
    }

    setString(name: string, index: number, value: string): Property {
        return this.setProperty(name, index, new Value(value, ValueTypes.STRING));
    }

    setStringByPath(path: any, value: string): Property {
        return this.setPropertyByPath(path, new Value(value, ValueTypes.STRING));
    }

    getString(identifier: string, index?: number): string {
        let property = this.getProperty(identifier, index);
        return !property ? null : property.getString();
    }

    getStrings(name: string): string[] {
        let values: string[] = [];
        let array = this.getPropertyArray(name);
        array.forEach((property: Property) => {
            values.push(property.getString());
        });
        return values;
    }

    addLong(name: string, value: number): Property {
        return this.addProperty(name, new Value(value, ValueTypes.LONG));
    }

    addLongs(name: string, values: number[]): Property[] {

        let properties: Property[] = [];
        values.forEach((value: number) => {
            properties.push(this.addLong(name, value));
        });
        return properties;
    }

    setLong(name: string, index: number, value: number): Property {
        return this.setProperty(name, index, new Value(value, ValueTypes.LONG));
    }

    // PropertySet methods

    setLongByPath(path: any, value: number): Property {
        return this.setPropertyByPath(path, new Value(value, ValueTypes.LONG));
    }

    getLong(identifier: string, index?: number): number {
        let property = this.getProperty(identifier, index);
        return !property ? null : property.getLong();
    }

    getLongs(name: string): number[] {
        let values: number[] = [];
        let array = this.getPropertyArray(name);
        array.forEach((property: Property) => {
            values.push(property.getLong());
        });
        return values;
    }

    addDouble(name: string, value: number): Property {
        return this.addProperty(name, new Value(value, ValueTypes.DOUBLE));
    }

    addDoubles(name: string, values: number[]): Property[] {

        let properties: Property[] = [];
        values.forEach((value: number) => {
            properties.push(this.addDouble(name, value));
        });
        return properties;
    }

    setDouble(name: string, index: number, value: number): Property {
        return this.setProperty(name, index, new Value(value, ValueTypes.DOUBLE));
    }

    // string methods

    setDoubleByPath(path: any, value: number): Property {
        return this.setPropertyByPath(path, new Value(value, ValueTypes.DOUBLE));
    }

    getDouble(identifier: string, index?: number): number {
        let property = this.getProperty(identifier, index);
        return !property ? null : property.getDouble();
    }

    getDoubles(name: string): number[] {
        let values: number[] = [];
        let array = this.getPropertyArray(name);
        array.forEach((property: Property) => {
            values.push(property.getDouble());
        });
        return values;
    }

    addBoolean(name: string, value: boolean): Property {
        return this.addProperty(name, new Value(value, ValueTypes.BOOLEAN));
    }

    addBooleans(name: string, values: boolean[]): Property[] {

        let properties: Property[] = [];
        values.forEach((value: boolean) => {
            properties.push(this.addBoolean(name, value));
        });
        return properties;
    }

    setBoolean(name: string, index: number, value: boolean): Property {
        return this.setProperty(name, index, new Value(value, ValueTypes.BOOLEAN));
    }

    // long methods

    setBooleanByPath(path: any, value: boolean): Property {
        return this.setPropertyByPath(path, new Value(value, ValueTypes.BOOLEAN));
    }

    getBoolean(identifier: string, index?: number): boolean {
        let property = this.getProperty(identifier, index);
        return !property ? null : property.getBoolean();
    }

    getBooleans(name: string): boolean[] {
        let values: boolean[] = [];
        let array = this.getPropertyArray(name);
        array.forEach((property: Property) => {
            values.push(property.getBoolean());
        });
        return values;
    }

    addReference(name: string, value: Reference): Property {
        return this.addProperty(name, new Value(value, ValueTypes.REFERENCE));
    }

    addReferences(name: string, values: Reference[]): Property[] {

        let properties: Property[] = [];
        values.forEach((value: Reference) => {
            properties.push(this.addReference(name, value));
        });
        return properties;
    }

    setReference(name: string, index: number, value: Reference): Property {
        return this.setProperty(name, index, new Value(value, ValueTypes.REFERENCE));
    }

    // double methods

    setReferenceByPath(path: any, value: Reference): Property {
        return this.setPropertyByPath(path, new Value(value, ValueTypes.REFERENCE));
    }

    getReference(identifier: string, index?: number): Reference {
        let property = this.getProperty(identifier, index);
        return !property ? null : property.getReference();
    }

    getReferences(name: string): Reference[] {
        let values: Reference[] = [];
        let array = this.getPropertyArray(name);
        array.forEach((property: Property) => {
            values.push(property.getReference());
        });
        return values;
    }

    addBinaryReference(name: string, value: BinaryReference): Property {
        return this.addProperty(name, new Value(value, ValueTypes.BINARY_REFERENCE));
    }

    addBinaryReferences(name: string, values: BinaryReference[]): Property[] {

        let properties: Property[] = [];
        values.forEach((value: BinaryReference) => {
            properties.push(this.addBinaryReference(name, value));
        });
        return properties;
    }

    setBinaryReference(name: string, index: number, value: BinaryReference): Property {
        return this.setProperty(name, index, new Value(value, ValueTypes.BINARY_REFERENCE));
    }

    // boolean methods

    setBinaryReferenceByPath(path: any, value: BinaryReference): Property {
        return this.setPropertyByPath(path, new Value(value, ValueTypes.BINARY_REFERENCE));
    }

    getBinaryReference(identifier: string, index?: number): BinaryReference {
        let property = this.getProperty(identifier, index);
        return !property ? null : property.getBinaryReference();
    }

    getBinaryReferences(name: string): BinaryReference[] {
        let values: BinaryReference[] = [];
        let array = this.getPropertyArray(name);
        array.forEach((property: Property) => {
            values.push(property.getBinaryReference());
        });
        return values;
    }

    addGeoPoint(name: string, value: GeoPoint): Property {
        return this.addProperty(name, new Value(value, ValueTypes.GEO_POINT));
    }

    addGeoPoints(name: string, values: GeoPoint[]): Property[] {

        let properties: Property[] = [];
        values.forEach((value: GeoPoint) => {
            properties.push(this.addGeoPoint(name, value));
        });
        return properties;
    }

    setGeoPoint(name: string, index: number, value: GeoPoint): Property {
        return this.setProperty(name, index, new Value(value, ValueTypes.GEO_POINT));
    }

    // reference methods

    setGeoPointByPath(path: any, value: GeoPoint): Property {
        return this.setPropertyByPath(path, new Value(value, ValueTypes.GEO_POINT));
    }

    getGeoPoint(identifier: string, index?: number): GeoPoint {
        let property = this.getProperty(identifier, index);
        return !property ? null : property.getGeoPoint();
    }

    getGeoPoints(name: string): GeoPoint[] {
        let values: GeoPoint[] = [];
        let array = this.getPropertyArray(name);
        array.forEach((property: Property) => {
            values.push(property.getGeoPoint());
        });
        return values;
    }

    addLocalDate(name: string, value: LocalDate): Property {
        return this.addProperty(name, new Value(value, ValueTypes.LOCAL_DATE));
    }

    addLocalDates(name: string, values: LocalDate[]): Property[] {

        let properties: Property[] = [];
        values.forEach((value: LocalDate) => {
            properties.push(this.addLocalDate(name, value));
        });
        return properties;
    }

    setLocalDate(name: string, index: number, value: LocalDate): Property {
        return this.setProperty(name, index, new Value(value, ValueTypes.LOCAL_DATE));
    }

    // binary reference methods

    setLocalDateByPath(path: any, value: LocalDate): Property {
        return this.setPropertyByPath(path, new Value(value, ValueTypes.LOCAL_DATE));
    }

    getLocalDate(identifier: string, index?: number): LocalDate {
        let property = this.getProperty(identifier, index);
        return !property ? null : property.getLocalDate();
    }

    getLocalDates(name: string): LocalDate[] {
        let values: LocalDate[] = [];
        let array = this.getPropertyArray(name);
        array.forEach((property: Property) => {
            values.push(property.getLocalDate());
        });
        return values;
    }

    addLocalDateTime(name: string, value: LocalDateTime): Property {
        return this.addProperty(name, new Value(value, ValueTypes.LOCAL_DATE_TIME));
    }

    addLocalDateTimes(name: string, values: LocalDateTime[]): Property[] {

        let properties: Property[] = [];
        values.forEach((value: LocalDateTime) => {
            properties.push(this.addLocalDateTime(name, value));
        });
        return properties;
    }

    setLocalDateTime(name: string, index: number, value: LocalDateTime): Property {
        return this.setProperty(name, index, new Value(value, ValueTypes.LOCAL_DATE_TIME));
    }

    // geo point methods

    setLocalDateTimeByPath(path: any, value: LocalDateTime): Property {
        return this.setPropertyByPath(path, new Value(value, ValueTypes.LOCAL_DATE_TIME));
    }

    getLocalDateTime(identifier: string, index?: number): LocalDateTime {
        let property = this.getProperty(identifier, index);
        return !property ? null : property.getLocalDateTime();
    }

    getLocalDateTimes(name: string): LocalDateTime[] {
        let values: LocalDateTime[] = [];
        let array = this.getPropertyArray(name);
        array.forEach((property: Property) => {
            values.push(property.getLocalDateTime());
        });
        return values;
    }

    addLocalTime(name: string, value: LocalTime): Property {
        return this.addProperty(name, new Value(value, ValueTypes.LOCAL_TIME));
    }

    addLocalTimes(name: string, values: LocalTime[]): Property[] {

        let properties: Property[] = [];
        values.forEach((value: LocalTime) => {
            properties.push(this.addLocalTime(name, value));
        });
        return properties;
    }

    setLocalTime(name: string, index: number, value: LocalTime): Property {
        return this.setProperty(name, index, new Value(value, ValueTypes.LOCAL_TIME));
    }

    // local date methods

    setLocalTimeByPath(path: any, value: LocalTime): Property {
        return this.setPropertyByPath(path, new Value(value, ValueTypes.LOCAL_TIME));
    }

    getLocalTime(identifier: string, index?: number): LocalTime {
        let property = this.getProperty(identifier, index);
        return !property ? null : property.getLocalTime();
    }

    getLocalTimes(name: string): LocalTime[] {
        let values: LocalTime[] = [];
        let array = this.getPropertyArray(name);
        array.forEach((property: Property) => {
            values.push(property.getLocalTime());
        });
        return values;
    }

    addDateTime(name: string, value: DateTime): Property {
        return this.addProperty(name, new Value(value, ValueTypes.DATE_TIME));
    }

    addDateTimes(name: string, values: DateTime[]): Property[] {

        let properties: Property[] = [];
        values.forEach((value: DateTime) => {
            properties.push(this.addDateTime(name, value));
        });
        return properties;
    }

    setDateTime(name: string, index: number, value: DateTime): Property {
        return this.setProperty(name, index, new Value(value, ValueTypes.DATE_TIME));
    }

    // local date time methods

    setDateTimeByPath(path: any, value: DateTime): Property {
        return this.setPropertyByPath(path, new Value(value, ValueTypes.DATE_TIME));
    }

    getDateTime(identifier: string, index?: number): DateTime {
        let property = this.getProperty(identifier, index);
        return !property ? null : property.getDateTime();
    }

    getDateTimes(name: string): DateTime[] {
        let values: DateTime[] = [];
        let array = this.getPropertyArray(name);
        array.forEach((property: Property) => {
            values.push(property.getDateTime());
        });
        return values;
    }

    private doSetProperty(path: PropertyPath, value: Value): Property {
        let firstPathElement = path.getFirstElement();
        if (path.elementCount() > 1) {
            let propertySet = this.getOrCreateSet(firstPathElement.getName(), firstPathElement.getIndex());
            return propertySet.setPropertyByPath(path.removeFirstPathElement(), value);
        } else {
            return this.setProperty(firstPathElement.getName(), firstPathElement.getIndex(), value);
        }
    }

    private getOrCreateSet(name: string, index: number): PropertySet {
        let existingProperty = this.getProperty(name, index);
        if (!existingProperty) {
            let newSet = this.tree ? new PropertySet(this.tree) : new PropertySet();
            this.setProperty(name, index, new Value(newSet, ValueTypes.DATA));
            return newSet;
        } else {
            return existingProperty.getPropertySet();
        }
    }

    private getOrCreatePropertyArray(name: string, type: ValueType): PropertyArray {

        let array = this.propertyArrayByName[name];
        if (!array) {
            array = PropertyArray.create().setParent(this).setName(name).setType(type).build();
            this.propertyArrayByName[name] = array;
            this.registerPropertyArrayListeners(array);
        }
        return array;
    }

    // local time methods

    private doRemoveEmptyValues(propertySet: PropertySet) {
        let toRemove = [];
        propertySet.forEach((property) => {
            let type = property.getType();
            if (property.hasNullValue()) {
                toRemove.push(property);
            } else if (type.equals(ValueTypes.STRING) && (property.getValue().getString() === '')) {
                toRemove.push(property);
            } else if (type.equals(ValueTypes.DATA)) {
                let propertySetValue = property.getValue().getPropertySet();
                this.doRemoveEmptyValues(propertySetValue);
                if (propertySetValue.isEmpty()) {
                    toRemove.push(property);
                }
            } else if (type.equals(ValueTypes.BOOLEAN) && (property.getValue().getBoolean() === false)) {
                toRemove.push(property);
            }
        });
        propertySet.removeProperties(toRemove);
        propertySet.removeEmptyArrays(propertySet);
    }

    private doRemoveEmptyArrays(propertySet: PropertySet) {
        propertySet.forEach((property) => {
            const type = property.getType();
            if (type.equals(ValueTypes.DATA)) {
                const propertySetValue = property.getValue().getPropertySet();
                this.removeEmptyArrays(propertySetValue);
            }
        });
        this.removeEmptyArrays(propertySet);
    }

    removeEmptyArrays(propertySet: PropertySet) {
        ObjectHelper.objectPropertyIterator(propertySet.propertyArrayByName, (name: string, propertyArray: PropertyArray) => {
            if (propertyArray.isEmpty()) {
                delete propertySet.propertyArrayByName[name];
            }
        });
    }

    getPropertyByPath(path: any): Property {
        if (ObjectHelper.iFrameSafeInstanceOf(path, PropertyPath)) {
            return this.doGetPropertyByPath(path as PropertyPath);
        } else {
            return this.doGetPropertyByPath(PropertyPath.fromString(path.toString()));
        }
    }

    private doGetPropertyByPath(path: PropertyPath): Property {

        let firstElement = path.getFirstElement();
        if (path.elementCount() > 1) {
            let property = this.getProperty(firstElement.getName(), firstElement.getIndex());
            if (!property) {
                return null;
            }
            let propertySet = property.getPropertySet();
            return propertySet.getPropertyByPath(path.removeFirstPathElement());
        } else {
            return this.getProperty(firstElement.getName(), firstElement.getIndex());
        }
    }

    private doDiff(other: PropertySet, checkedProperties: string[] = []): PropertyTreeDiff {
        let added = [];
        let removed = [];
        let modified = [];

        this.forEach((property) => {
            if (checkedProperties.indexOf(property.getPath().toString()) === -1) {
                let type = property.getType();
                let otherProperty = other.getProperty(property.getName(), property.getIndex());

                if (!otherProperty) {
                    removed.push(property);
                } else if (!type.equals(ValueTypes.DATA)) {
                    if (!property.equals(otherProperty)) {
                        modified.push({
                            oldValue: property,
                            newValue: otherProperty
                        });
                    }
                    checkedProperties.push(property.getPath().toString());
                } else {
                    let propertySetValue = property.getValue().getPropertySet();
                    let diff = propertySetValue.doDiff(otherProperty.getValue().getPropertySet(), checkedProperties);

                    added = added.concat(diff.added);
                    removed = removed.concat(diff.removed);
                    modified = modified.concat(diff.modified);
                }
            }
        });

        return {
            added: added,
            removed: removed,
            modified: modified
        };
    }

    // date time methods

    private registerPropertyArrayListeners(array: PropertyArray) {
        if (PropertySet.debug) {
            console.debug('PropertySet[' + this.getPropertyPath().toString() + '].registerPropertyArrayListeners: ' + array.getName());
        }

        array.onPropertyAdded(this.propertyAddedEventHandler);
        array.onPropertyRemoved(this.propertyRemovedEventHandler);
        array.onPropertyMoved(this.propertyMovedEventHandler);
        array.onPropertyValueChanged(this.propertyValueChangedEventHandler);
    }

    private notifyChangedListeners(event: PropertyEvent) {
        if (PropertySet.debug) {
            console.debug('PropertySet[' + this.getPropertyPath().toString() + '].notifyChangedListeners: ' +
                          event.toString());
        }
        this.changedListeners.forEach((listener) => listener(event));
    }

    private forwardPropertyAddedEvent(event: PropertyAddedEvent) {
        this.propertyAddedListeners.forEach((listener) => listener(event));
        if (PropertySet.debug) {
            console.debug('PropertySet[' + this.getPropertyPath().toString() + '].forwardPropertyAddedEvent: ' +
                          event.toString());
        }
        this.notifyChangedListeners(event);
    }

    private forwardPropertyRemovedEvent(event: PropertyRemovedEvent) {
        if (PropertySet.debug) {
            console.debug('PropertySet[' + this.getPropertyPath().toString() + '].forwardPropertyRemovedEvent: ' +
                          event.toString());
        }
        this.propertyRemovedListeners.forEach((listener) => listener(event));
        this.notifyChangedListeners(event);
    }

    private forwardPropertyMovedEvent(event: PropertyMovedEvent) {
        if (PropertySet.debug) {
            console.debug('PropertySet[' + this.getPropertyPath().toString() + '].forwardPropertyMovedEvent: ' +
                          event.toString());
        }
        this.propertyMovedListeners.forEach((listener) => listener(event));
        this.notifyChangedListeners(event);
    }

    private forwardPropertyValueChangedEvent(event: PropertyValueChangedEvent) {
        if (PropertySet.debug) {
            console.debug('PropertySet[' + this.getPropertyPath().toString() + '].forwardPropertyValueChangedEvent: ' +
                          event.toString());
        }
        this.propertyValueChangedListeners.forEach((listener) => listener(event));
        this.notifyChangedListeners(event);
    }
}
