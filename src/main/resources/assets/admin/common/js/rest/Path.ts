export class Path {

    private static DEFAULT_ELEMENT_DIVIDER: string = '/';

    private elementDivider: string;

    private absolute: boolean;

    private elements: string[];

    private refString: string;

    constructor(elements: string[], elementDivider?: string, absolute?: boolean) {
        this.elementDivider = elementDivider != null ? elementDivider : Path.DEFAULT_ELEMENT_DIVIDER;
        this.absolute = absolute == null ? true : absolute;
        elements.forEach((element: string, index: number) => {
            if (element == null) {
                throw new Error('Path element was null at index: ' + index);
            } else if (element.length === 0) {
                throw new Error('Path element was empty string at index: ' + index);
            }
        });
        this.elements = elements;
        this.refString = (this.absolute ? this.elementDivider : '') + this.elements.join(this.elementDivider);
    }

    public static fromString(s: string, elementDivider?: string) {
        if (elementDivider == null) {
            elementDivider = Path.DEFAULT_ELEMENT_DIVIDER;
        }
        let absolute: boolean = s.charAt(0) === elementDivider;
        let elements: string[] = s.split(elementDivider);
        return new Path(Path.removeEmptyElements(elements), elementDivider, absolute);
    }

    public static fromParent(parent: Path, ...childElements: string[]) {

        let elements: string[] = parent.elements.slice(0);
        childElements.forEach((element: string) => {
            elements.push(element);
        });

        return new Path(elements, parent.elementDivider, parent.isAbsolute());
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

    getElements(): string[] {
        return this.elements;
    }

    getElement(index: number): string {
        return this.elements[index];
    }

    hasParent(): boolean {
        return this.elements.length > 1;
    }

    getParentPath(): Path {

        if (this.elements.length < 1) {
            return null;
        }
        let parentElemements: string[] = [];
        this.elements.forEach((element: string, index: number) => {
            if (index < this.elements.length - 1) {
                parentElemements.push(element);
            }
        });
        return new Path(parentElemements);
    }

    toString() {
        return this.refString;
    }

    isAbsolute(): boolean {
        return this.absolute;
    }
}
