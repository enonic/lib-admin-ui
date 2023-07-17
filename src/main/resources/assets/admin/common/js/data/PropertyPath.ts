import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';
import {assert} from '../util/Assert';

export class PropertyPath
    implements Equitable {

    public static ROOT: PropertyPath = new PropertyPath([], true);
    private static ELEMENT_DIVIDER: string = '.';
    private absolute: boolean;

    private elements: PropertyPathElement[];

    private refString: string;

    constructor(elements: PropertyPathElement[], absolute: boolean = true) {

        this.absolute = absolute;
        elements.forEach((element: PropertyPathElement, index: number) => {
            if (element == null) {
                throw new Error('Path element was null at index: ' + index);
            } else if (element.getName().length === 0) {
                throw new Error('Path element was empty string at index: ' + index);
            }
        });
        this.elements = elements;
        this.refString = (this.absolute ? PropertyPath.ELEMENT_DIVIDER : '') + this.elements.join(PropertyPath.ELEMENT_DIVIDER);
    }

    static fromString(s: string) {
        let absolute: boolean = s.charAt(0) === PropertyPath.ELEMENT_DIVIDER;
        let dataPathElements = s.split(PropertyPath.ELEMENT_DIVIDER).filter((element: string) => !!element).// filter empty elements
        map((element: string) => PropertyPathElement.fromString(element));  // map string to DataPathElement
        return new PropertyPath(dataPathElements, absolute);
    }

    static fromParent(parent: PropertyPath, ...childElements: PropertyPathElement[]) {

        let elements: PropertyPathElement[] = parent.elements.slice(0).concat(childElements);
        return new PropertyPath(elements, parent.isAbsolute());
    }

    static fromPathElement(element: PropertyPathElement) {

        return new PropertyPath([element], true);
    }

    removeFirstPathElement(): PropertyPath {
        assert(this.elements.length > 1,
            'Cannot create new path without first path element when path does not contain more than one element');
        return new PropertyPath(this.elements.slice(1), this.absolute);
    }

    elementCount(): number {
        return this.getElements().length;
    }

    getElements(): PropertyPathElement[] {
        return this.elements;
    }

    getElement(index: number): PropertyPathElement {
        return this.elements[index];
    }

    getFirstElement(): PropertyPathElement {
        return this.elements[0];
    }

    getLastElement(): PropertyPathElement {
        return this.elements[this.elements.length - 1];
    }

    hasParent(): boolean {
        return this.elements.length > 0;
    }

    getParentPath(): PropertyPath {

        if (this.elements.length < 1) {
            return null;
        }
        return new PropertyPath(this.elements.slice(0, -1));
    }

    toString() {
        return this.refString;
    }

    isAbsolute(): boolean {
        return this.absolute;
    }

    asRelative(): PropertyPath {
        return new PropertyPath(this.elements, false);
    }

    isRoot(): boolean {
        return this.elementCount() === 0;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, PropertyPath)) {
            return false;
        }

        let other = o as PropertyPath;

        if (!ObjectHelper.stringEquals(this.refString, other.refString)) {
            return false;
        }

        return true;
    }
}

export class PropertyPathElement {

    private name: string;

    private index: number;

    constructor(name: string, index: number) {
        this.name = name;
        this.index = index;
    }

    static fromString(str: string) {
        if (str.indexOf('[') === -1) {
            return new PropertyPathElement(str, 0);
        }
        let name = str.substring(0, str.indexOf('['));
        let index = parseInt(str.substring(str.indexOf('[') + 1, str.indexOf(']')), 10);
        return new PropertyPathElement(name, index);
    }

    getName(): string {
        return this.name;
    }

    getIndex(): number {
        return this.index;
    }

    toString(): string {
        if (this.index === 0) {
            return this.name;
        } else {
            return this.name + '[' + this.index + ']';
        }
    }
}
