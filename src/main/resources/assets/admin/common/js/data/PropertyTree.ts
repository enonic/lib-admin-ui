import {Reference} from '../util/Reference';
import {BinaryReference} from '../util/BinaryReference';
import {GeoPoint} from '../util/GeoPoint';
import {LocalTime} from '../util/LocalTime';
import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';
import {LocalDate} from '../util/LocalDate';
import {LocalDateTime} from '../util/LocalDateTime';
import {DateTime} from '../util/DateTime';
import {Property} from './Property';
import {PropertySet} from './PropertySet';
import {PropertyArrayJson} from './PropertyArrayJson';
import {assertNotNull} from '../util/Assert';
import {PropertyArray} from './PropertyArray';
import {Value} from './Value';
import {PropertyEvent} from './PropertyEvent';
import {PropertyAddedEvent} from './PropertyAddedEvent';
import {PropertyRemovedEvent} from './PropertyRemovedEvent';
import {PropertyValueChangedEvent} from './PropertyValueChangedEvent';
import {PropertyMovedEvent} from './PropertyMovedEvent';

export interface PropertyTreeDiff {
    added: Property[];
    removed: Property[];
    modified: { oldValue: Property; newValue: Property }[];
}

/**
 * The PropertyTree is the root container of properties.
 *
 * The PropertyTree is mutable and most mutations can be observed by listening to the following events:
 * * [[PropertyAddedEvent]]
 * * [[PropertyRemovedEvent]]
 * * [[PropertyIndexChangedEvent]]
 * * [[PropertyValueChangedEvent]]
 *
 * The PropertyTree provides several functions for both creation, updating and getting property values of a certain type (see [[ValueTypes]]).
 * Instead of repeating the documentation for each type, here is an overview of the functions which exists for each [[ValueType]]
 * (replace Xxx with one of the value types).
 *
 * * addXxx(name, value) : Property
 * > Creates a new property with the given name and value, and adds it to the root PropertySet.
 * Returns the added property.
 *
 * * addXxxs(name: string, values:Xxx[]) : Property[]
 * > Creates new properties with the given name and values, and adds them to the root PropertySet.
 * Returns an array of the added properties.
 *
 * * setXxx(name: string, value: Xxx, index: number) : Property
 * > On the root PropertySet: Creates a new property with given name, index and value or updates existing with given value.
 * Returns the created or updated property.
 *
 * * setXxxByPath(path: any, value: Xxx) : Property
 * > Creates a new property at given path with given value or updates existing with given value. path can either be a string or [[PropertyPath]].
 * Returns the created or updated property.
 *
 * * getXxx(identifier: string, index: number): Xxx
 * > Gets a property value of type Xxx with given identifier and optional index. If index is given, then the identifier is understood
 *  as the name of the property and it will be retrieved from the root PropertySet. If the index is omitted the identifier is understood
 *  as the absolute path of the property.
 *
 * * getXxxs(name: string): Xxx[]
 * > Gets property values of type Xxx with the given name. Returns an array of type Xxx.
 *
 * @see [[Property]]
 * @see [[PropertyArray]]
 * @see [[PropertySet]]
 */
export class PropertyTree
    implements Equitable {

    private root: PropertySet;

    /**
     * * To create a copy of another tree:
     * > give the root [[PropertySet]] of the tree to copy from
     *
     * @param sourceRoot optional. If given this tree will be a copy of the given [[PropertySet]].
     */
    constructor(sourceRoot?: PropertySet) {

        if (sourceRoot) {
            this.root = sourceRoot.copy(this);
            // Ensure to register all properties from sourceRoot
        } else {
            this.root = new PropertySet(this);
        }
    }

    public static fromJson(json: PropertyArrayJson[]): PropertyTree {

        assertNotNull(json, 'a json is required');
        let tree = new PropertyTree();

        json.forEach((propertyArrayJson: PropertyArrayJson) => {
            tree.root.addPropertyArray(PropertyArray.fromJson(propertyArrayJson, tree.root, tree));
        });

        return tree;
    }

    /**
     * @returns {PropertySet} Returns the root [[PropertySet]] of this tree.
     */
    public getRoot(): PropertySet {
        return this.root;
    }

    addProperty(name: string, value: Value): Property {
        return this.root.addProperty(name, value);
    }

    setPropertyByPath(path: any, value: Value): Property {
        return this.root.setPropertyByPath(path, value);
    }

    setProperty(name: string, index: number, value: Value): Property {
        return this.root.setProperty(name, index, value);
    }

    removeProperties(properties: Property[]) {
        this.root.removeProperties(properties);
    }

    removeProperty(name: string, index: number) {
        this.root.removeProperty(name, index);
    }

    /**
     * * getProperty() - If no arguments are given then this PropertySet's Property is returned.
     * * getProperty(name: string, index: number) - If name and index are given then property with that name and index is returned.
     * * getProperty(path: string) - If a path as string is given then property with that path is returned.
     * * getProperty(path: PropertyPath ) - If a path as [[PropertyPath]] is given then property with that path is returned.
     *
     * @see [[PropertySet.getProperty]]
     * @param identifier
     * @param index
     * @returns {Property}
     */
    getProperty(identifier?: any, index?: number): Property {
        return this.root.getProperty(identifier, index);
    }

    getPropertyArray(name: string): PropertyArray {
        return this.root.getPropertyArray(name);
    }

    forEachProperty(name: string, callback: (property: Property, index?: number) => void) {

        this.root.forEachProperty(name, callback);
    }

    /**
     * @param o
     * @returns {boolean} true if given [[Equitable]] equals this tree.
     */
    public equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, PropertyTree)) {
            return false;
        }

        let other = o as PropertyTree;

        if (!ObjectHelper.equals(this.root, other.root)) {
            return false;
        }

        return true;
    }

    public removeEmptyValues() {
        this.root.removeEmptyValues();
    }

    public diff(other: PropertyTree): PropertyTreeDiff {
        return this.root.diff(other.root);
    }

    /**
     * Copies this tree (deep copy).
     * @see [[PropertySet.copy]]
     * @returns {PropertyTree}
     */
    copy(): PropertyTree {
        return new PropertyTree(this.getRoot());
    }

    toJson(): PropertyArrayJson[] {

        return this.getRoot().toJson();
    }

    /**
     * Register a listener-function to be called when any [[PropertyEvent]] has been fired anywhere in the tree.
     * @param listener
     * @see [[PropertyEvent]]
     */
    onChanged(listener: (event: PropertyEvent) => void) {
        this.root.onChanged(listener);
    }

    /**
     * Deregister a listener-function.
     * @param listener
     * @see [[PropertyEvent]]
     */
    unChanged(listener: (event: PropertyEvent) => void) {
        this.root.unChanged(listener);
    }

    /**
     * Register a listener-function to be called when a [[Property]] has been added anywhere in the tree.
     * @param listener
     * @see [[PropertyAddedEvent]]
     */
    onPropertyAdded(listener: (event: PropertyAddedEvent) => void) {
        this.root.onPropertyAdded(listener);
    }

    /**
     * Deregister a listener-function.
     * @param listener
     * @see [[PropertyAddedEvent]]
     */
    unPropertyAdded(listener: (event: PropertyAddedEvent) => void) {
        this.root.unPropertyAdded(listener);
    }

    /**
     * Register a listener-function to be called when a [[Property]] has been removed anywhere in the tree.
     * @param listener
     * @see [[PropertyRemovedEvent]]
     */
    onPropertyRemoved(listener: (event: PropertyRemovedEvent) => void) {
        this.root.onPropertyRemoved(listener);
    }

    /**
     * Deregister a listener-function.
     * @param listener
     * @see [[PropertyRemovedEvent]]
     */
    unPropertyRemoved(listener: (event: PropertyRemovedEvent) => void) {
        this.root.unPropertyRemoved(listener);
    }

    /**
     * Register a listener-function to be called when a [[Property.index]] has changed anywhere in the tree.
     * @param listener
     * @see [[PropertyMovedEvent]]
     */
    onPropertyMoved(listener: (event: PropertyMovedEvent) => void) {
        this.root.onPropertyMoved(listener);
    }

    /**
     * Deregister a listener-function.
     * @param listener
     * @see [[PropertyMovedEvent]]
     */
    unPropertyMoved(listener: (event: PropertyMovedEvent) => void) {
        this.root.unPropertyMoved(listener);
    }

    /**
     * Register a listener-function to be called when a [[Property.value]] has changed anywhere in the tree.
     * @param listener
     * @see [[PropertyValueChangedEvent]]
     */
    onPropertyValueChanged(listener: (event: PropertyValueChangedEvent) => void) {
        this.root.onPropertyValueChanged(listener);
    }

    /**
     * Deregister a listener-function.
     * @param listener
     * @see [[PropertyValueChangedEvent]]
     */
    unPropertyValueChanged(listener: (event: PropertyValueChangedEvent) => void) {
        this.root.unPropertyValueChanged(listener);
    }

    // PropertySet methods

    /**
     * Creates a new [[PropertySet]] attached to this tree.
     * The PropertySet is not added to the tree.
     */
    newPropertySet(): PropertySet {
        return new PropertySet(this);
    }

    addPropertySet(name: string, value?: PropertySet): PropertySet {
        return this.root.addPropertySet(name, value);
    }

    setPropertySet(name: string, index: number, value: PropertySet): Property {
        return this.root.setPropertySet(name, index, value);
    }

    setPropertySetByPath(path: any, value: PropertySet): Property {
        return this.root.setPropertySetByPath(path, value);
    }

    getPropertySet(identifier: any, index?: number): PropertySet {
        return this.root.getPropertySet(identifier, index);
    }

    getPropertySets(name: string): PropertySet[] {
        return this.root.getPropertySets(name);
    }

    // string methods

    addString(name: string, value: string): Property {
        return this.root.addString(name, value);
    }

    addStrings(name: string, values: string[]): Property[] {
        return this.root.addStrings(name, values);
    }

    setString(name: string, index: number, value: string): Property {
        return this.root.setString(name, index, value);
    }

    setStringByPath(path: any, value: string): Property {
        return this.root.setStringByPath(path, value);
    }

    getString(identifier: any, index?: number): string {
        return this.root.getString(identifier, index);
    }

    getStrings(name: string): string[] {
        return this.root.getStrings(name);
    }

    // long methods

    addLong(name: string, value: number): Property {
        return this.root.addLong(name, value);
    }

    addLongs(name: string, values: number[]): Property[] {
        return this.root.addLongs(name, values);
    }

    setLong(name: string, index: number, value: number): Property {
        return this.root.setLong(name, index, value);
    }

    setLongByPath(path: any, value: number): Property {
        return this.root.setLongByPath(path, value);
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

    // double methods

    addDouble(name: string, value: number): Property {
        return this.root.addDouble(name, value);
    }

    addDoubles(name: string, values: number[]): Property[] {
        return this.root.addDoubles(name, values);
    }

    setDouble(name: string, index: number, value: number): Property {
        return this.root.setDouble(name, index, value);
    }

    setDoubleByPath(path: any, value: number): Property {
        return this.root.setDoubleByPath(path, value);
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

    // boolean methods

    addBoolean(name: string, value: boolean): Property {
        return this.root.addBoolean(name, value);
    }

    addBooleans(name: string, values: boolean[]): Property[] {
        return this.root.addBooleans(name, values);
    }

    setBoolean(name: string, index: number, value: boolean): Property {
        return this.root.setBoolean(name, index, value);
    }

    setBooleanByPath(path: any, value: boolean): Property {
        return this.root.setBooleanByPath(path, value);
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

    // reference methods

    addReference(name: string, value: Reference): Property {
        return this.root.addReference(name, value);
    }

    addReferences(name: string, values: Reference[]): Property[] {
        return this.root.addReferences(name, values);
    }

    setReference(name: string, index: number, value: Reference): Property {
        return this.root.setReference(name, index, value);
    }

    setReferenceByPath(path: any, value: Reference): Property {
        return this.root.setReferenceByPath(path, value);
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

    // binary reference methods

    addBinaryReference(name: string, value: BinaryReference): Property {
        return this.root.addBinaryReference(name, value);
    }

    addBinaryReferences(name: string, values: BinaryReference[]): Property[] {
        return this.root.addBinaryReferences(name, values);
    }

    setBinaryReference(name: string, index: number, value: BinaryReference): Property {
        return this.root.setBinaryReference(name, index, value);
    }

    setBinaryReferenceByPath(path: any, value: BinaryReference): Property {
        return this.root.setBinaryReferenceByPath(path, value);
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

    // geo point methods

    addGeoPoint(name: string, value: GeoPoint): Property {
        return this.root.addGeoPoint(name, value);
    }

    addGeoPoints(name: string, values: GeoPoint[]): Property[] {
        return this.root.addGeoPoints(name, values);
    }

    setGeoPoint(name: string, index: number, value: GeoPoint): Property {
        return this.root.setGeoPoint(name, index, value);
    }

    setGeoPointByPath(path: any, value: GeoPoint): Property {
        return this.root.setGeoPointByPath(path, value);
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

    // local date methods

    addLocalDate(name: string, value: LocalDate): Property {
        return this.root.addLocalDate(name, value);
    }

    addLocalDates(name: string, values: LocalDate[]): Property[] {
        return this.root.addLocalDates(name, values);
    }

    setLocalDate(name: string, index: number, value: LocalDate): Property {
        return this.root.setLocalDate(name, index, value);
    }

    setLocalDateByPath(path: any, value: LocalDate): Property {
        return this.root.setLocalDateByPath(path, value);
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

    // local date time methods

    addLocalDateTime(name: string, value: LocalDateTime): Property {
        return this.root.addLocalDateTime(name, value);
    }

    addLocalDateTimes(name: string, values: LocalDateTime[]): Property[] {
        return this.root.addLocalDateTimes(name, values);
    }

    setLocalDateTime(name: string, index: number, value: LocalDateTime): Property {
        return this.root.setLocalDateTime(name, index, value);
    }

    setLocalDateTimeByPath(path: any, value: LocalDateTime): Property {
        return this.root.setLocalDateTimeByPath(path, value);
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

    // local time methods

    addLocalTime(name: string, value: LocalTime): Property {
        return this.root.addLocalTime(name, value);
    }

    addLocalTimes(name: string, values: LocalTime[]): Property[] {
        return this.root.addLocalTimes(name, values);
    }

    setLocalTime(name: string, index: number, value: LocalTime): Property {
        return this.root.setLocalTime(name, index, value);
    }

    setLocalTimeByPath(path: any, value: LocalTime): Property {
        return this.root.setLocalTimeByPath(path, value);
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

    // date time methods

    addDateTime(name: string, value: DateTime): Property {
        return this.root.addDateTime(name, value);
    }

    addDateTimes(name: string, values: DateTime[]): Property[] {
        return this.root.addDateTimes(name, values);
    }

    setDateTime(name: string, index: number, value: DateTime): Property {
        return this.root.setDateTime(name, index, value);
    }

    setDateTimeByPath(path: any, value: DateTime): Property {
        return this.root.setDateTimeByPath(path, value);
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

    isEmpty(): boolean {
        return this.root.isEmpty();
    }
}
