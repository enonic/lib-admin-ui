export class Path {

    public static DEFAULT_ELEMENT_DIVIDER: string = '/';

    protected readonly elementDivider: string;

    protected readonly absolute: boolean;

    protected readonly elements: string[];

    protected readonly refString: string;

    constructor(builder: PathBuilder) {
        this.elementDivider = builder.elementDivider != null ? builder.elementDivider : Path.DEFAULT_ELEMENT_DIVIDER;
        this.absolute = builder.absolute == null ? true : builder.absolute;
        builder.elements.forEach((element: string, index: number) => {
            if (element == null) {
                throw new Error('Path element was null at index: ' + index);
            } else if (element.length === 0) {
                throw new Error('Path element was empty string at index: ' + index);
            }
        });
        this.elements = builder.elements;
        this.refString = (this.absolute ? this.elementDivider : '') + this.elements.join(this.elementDivider);
    }

    public static removeEmptyElements(elements: string[]): string[] {
        return elements.filter((element: string) => element.length > 0);
    }

    getElements(): string[] {
        return this.elements.slice(0);
    }

    getElement(index: number): string {
        return this.elements[index];
    }

    hasParent(): boolean {
        return this.elements.length > 1;
    }

    getDivider(): string {
        return this.elementDivider;
    }

    getParentPath(): Path {
        if (this.elements.length < 1) {
            return null;
        }

        const parentElements: string[] = [];

        this.elements.forEach((element: string, index: number) => {
            if (index < this.elements.length - 1) {
                parentElements.push(element);
            }
        });

        return this.newBuilder().setElements(parentElements).build();
    }

    getLevel(): number {
        return this.elements.length;
    }

    toString() {
        return this.refString;
    }

    isAbsolute(): boolean {
        return this.absolute;
    }

    newBuilder(): PathBuilder {
        return new PathBuilder(this);
    }

    public static create(): PathBuilder {
        return new PathBuilder();
    }

    public static fromString(s: string, elementDivider: string = Path.DEFAULT_ELEMENT_DIVIDER): Path {
        return Path.create().fromString(s, elementDivider).build();
    }
}

export class PathBuilder {

    elementDivider: string;

    absolute: boolean;

    elements: string[];

    constructor(source?: Path) {
        if (source) {
            this.elements = source.getElements();
            this.elementDivider = source.getDivider();
            this.absolute = source.isAbsolute();
        }
    }

    fromString(s: string, elementDivider: string = Path.DEFAULT_ELEMENT_DIVIDER): PathBuilder {
        this.elementDivider = elementDivider;
        this.absolute = s.indexOf(elementDivider) === 0;
        this.elements = Path.removeEmptyElements(s.split(elementDivider));

        return this;
    }

    fromParent(parent: Path, ...childElements: string[]): PathBuilder {
        const elements: string[] = parent.getElements();
        childElements.forEach((element: string) => element && elements.push(element));

        this.elements = elements;
        this.elementDivider = parent.getDivider();
        this.absolute = parent.isAbsolute();

        return this;
    }

    setElements(value: string[]): PathBuilder {
        this.elements = value;
        return this;
    }

    setElementDivider(value: string): PathBuilder {
        this.elementDivider = value;
        return this;
    }

    setAbsolute(value: boolean): PathBuilder {
        this.absolute = value;
        return this;
    }

    build(): Path {
        return new Path(this);
    }
}
