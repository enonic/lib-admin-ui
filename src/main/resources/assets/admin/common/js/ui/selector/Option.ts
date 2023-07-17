import {IDentifiable} from '../../IDentifiable';
import {Equitable} from '../../Equitable';
import {ObjectHelper} from '../../ObjectHelper';

export class Option<T>
    implements Slick.SlickData, IDentifiable {

    private value: string;

    private displayValue: T;

    private readonly indices: string[];

    private readOnly: boolean;

    private readonly empty: boolean;

    private readonly selectable: boolean;

    private readonly expandable: boolean;

    constructor(builder: OptionBuilder<T>) {
        this.value = builder.value;
        this.displayValue = builder.displayValue;
        this.indices = builder.indices || [];
        this.readOnly = !!builder.readOnly;
        this.empty = !!builder.empty;
        this.selectable = !!builder.selectable;
        this.expandable = !!builder.expandable;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, Option)) {
            return false;
        }

        const other: Option<T> = o as Option<T>;

        return this.value === other.value;
    }

    setValue(value: string) {
        this.value = value;
    }

    getValue(): string {
        return this.value;
    }

    setDisplayValue(value: T) {
        this.displayValue = value;
    }

    getDisplayValue(): T {
        return this.displayValue;
    }

    getIndices(): string[] {
        return this.indices;
    }

    setReadOnly(value: boolean) {
        this.readOnly = value;
    }

    isReadOnly(): boolean {
        return this.readOnly;
    }

    isEmpty(): boolean {
        return this.empty;
    }

    isSelectable(): boolean {
        return this.selectable;
    }

    isExpandable(): boolean {
        return this.expandable;
    }

    static create<T>(): OptionBuilder<T> {
        return new OptionBuilder<T>();
    }

    getId(): string {
        return this.value;
    }
}

export class OptionBuilder<T> {

    value: string;

    displayValue: T;

    indices: string[] = [];

    readOnly: boolean = false;

    empty: boolean = false;

    selectable: boolean = true;

    expandable: boolean = true;

    setValue(value: string): OptionBuilder<T> {
        this.value = value;
        return this;
    }

    setDisplayValue(value: T): OptionBuilder<T> {
        this.displayValue = value;
        return this;
    }

    setIndices(value: string[]): OptionBuilder<T> {
        this.indices = value;
        return this;
    }

    setReadOnly(value: boolean): OptionBuilder<T> {
        this.readOnly = value;
        return this;
    }

    setEmpty(value: boolean): OptionBuilder<T> {
        this.empty = value;
        return this;
    }

    setSelectable(value: boolean): OptionBuilder<T> {
        this.selectable = value;
        return this;
    }

    setExpandable(value: boolean): OptionBuilder<T> {
        this.expandable = value;
        return this;
    }

    build(): Option<T> {
        return new Option<T>(this);
    }
}
