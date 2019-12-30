export class FormItemPath {

    private static DEFAULT_ELEMENT_DIVIDER: string = '.';

    public static ROOT: FormItemPath = new FormItemPath([], FormItemPath.DEFAULT_ELEMENT_DIVIDER, true);

    private elementDivider: string;

    private absolute: boolean;

    private elements: FormItemPathElement[];

    private refString: string;

    constructor(elements: FormItemPathElement[], elementDivider?: string, absolute?: boolean) {
        this.elementDivider = elementDivider != null ? elementDivider : FormItemPath.DEFAULT_ELEMENT_DIVIDER;
        this.absolute = absolute == null ? true : absolute;
        elements.forEach((element: FormItemPathElement, index: number) => {
            if (element == null) {
                throw new Error('Path element was null at index: ' + index);
            } else if (element.getName().length === 0) {
                throw new Error('Path element was empty string at index: ' + index);
            }
        });
        this.elements = elements;
        this.refString = (this.absolute ? this.elementDivider : '') + this.elements.join(this.elementDivider);
    }

    static fromString(s: string, elementDivider?: string) {
        if (elementDivider == null) {
            elementDivider = FormItemPath.DEFAULT_ELEMENT_DIVIDER;
        }
        let absolute: boolean = s.charAt(0) === elementDivider;
        let elements: string[] = s.split(elementDivider);
        elements = FormItemPath.removeEmptyElements(elements);
        let pathElements: FormItemPathElement[] = [];
        elements.forEach((str: string) => {
            pathElements.push(FormItemPathElement.fromString(str));
        });
        return new FormItemPath(pathElements, elementDivider, absolute);
    }

    static fromParent(parent: FormItemPath, ...childElements: FormItemPathElement[]) {

        let elements: FormItemPathElement[] = parent.elements.slice(0);
        childElements.forEach((element: FormItemPathElement) => {
            elements.push(element);
        });

        return new FormItemPath(elements, parent.elementDivider, parent.isAbsolute());
    }

    private static removeEmptyElements(elements: string[]): string[] {
        let filteredElements: string[] = [];
        elements.forEach((element: string) => {
            if (element.length > 0) {
                filteredElements.push(element);
            }
        });
        return filteredElements;
    }

    newWithoutFirstElement(): FormItemPath {
        let arr = this.elements;
        arr.shift();
        return new FormItemPath(arr);
    }

    elementCount(): number {
        return this.getElements().length;
    }

    getElements(): FormItemPathElement[] {
        return this.elements;
    }

    getElement(index: number): FormItemPathElement {
        return this.elements[index];
    }

    getFirstElement(): FormItemPathElement {
        return this.elements[0];
    }

    getLastElement(): FormItemPathElement {
        return this.elements[this.elements.length - 1];
    }

    hasParent(): boolean {
        return this.elements.length > 0;
    }

    getParentPath(): FormItemPath {

        if (this.elements.length < 1) {
            return null;
        }
        let parentElemements: FormItemPathElement[] = [];
        this.elements.forEach((element: FormItemPathElement, index: number) => {
            if (index < this.elements.length - 1) {
                parentElemements.push(element);
            }
        });
        return new FormItemPath(parentElemements);
    }

    toString() {
        return this.refString;
    }

    isAbsolute(): boolean {
        return this.absolute;
    }
}

export class FormItemPathElement {

    private name: string;

    constructor(name: string) {
        this.name = name;
    }

    static fromString(str: string) {
        return new FormItemPathElement(str);
    }

    getName(): string {
        return this.name;
    }

    toString(): string {
        return this.name;
    }
}
