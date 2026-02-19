import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';

export class InputTypeName
    implements Equitable {

    private static CUSTOM_PREFIX: string = 'custom:';

    private custom: boolean;

    private name: string;

    private refString: string;

    constructor(name: string, custom: boolean) {
        this.name = this.resolveInputTypeName(name);
        this.custom = custom;

        if (this.custom) {
            this.refString = InputTypeName.CUSTOM_PREFIX + name;
        } else {
            this.refString = this.name;
        }
    }

    static parseInputTypeName(str: string) {
        if (str.substr(0, InputTypeName.CUSTOM_PREFIX.length) === InputTypeName.CUSTOM_PREFIX) {
            return new InputTypeName(str.substr(InputTypeName.CUSTOM_PREFIX.length, str.length), true);
        } else {
            return new InputTypeName(str, false);
        }
    }

    getName(): string {
        return this.name;
    }

    isBuiltIn(): boolean {
        return !this.custom;
    }

    toString(): string {
        return this.refString;
    }

    private resolveInputTypeName(value: string): string {
        const rawTypeInputName = value;
        if (rawTypeInputName === 'Instant') {
            return 'DateTime';
        } else if (rawTypeInputName === 'DateTime') {
            return 'LocalDateTime';
        } else {
            return rawTypeInputName;
        }
    }

    public toJson(): string {
        return this.toString();
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, InputTypeName)) {
            return false;
        }

        let other = o as InputTypeName;

        if (!ObjectHelper.booleanEquals(this.custom, other.custom)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.name, other.name)) {
            return false;
        }

        return true;
    }
}
