import {Equitable} from '../Equitable';
import {ApplicationKey} from '../application/ApplicationKey';
import {ObjectHelper} from '../ObjectHelper';

export class MacroKey
    implements Equitable {

    private static SEPARATOR: string = ':';

    private applicationKey: ApplicationKey;

    private name: string;

    private refString: string;

    constructor(applicationKey: ApplicationKey, name: string) {
        this.applicationKey = applicationKey;
        this.name = name;
        this.refString = applicationKey.toString() + MacroKey.SEPARATOR + name.toString();
    }

    public static fromString(str: string): MacroKey {
        let sepIndex: number = str.indexOf(this.SEPARATOR);
        if (sepIndex === -1) {
            throw new Error(`MacroKey must contain separator '${this.SEPARATOR}':${str}`);
        }

        let applicationKey = str.substring(0, sepIndex);
        let name = str.substring(sepIndex + 1, str.length);

        return new MacroKey(ApplicationKey.fromString(applicationKey), name);
    }

    public getApplicationKey(): ApplicationKey {
        return this.applicationKey;
    }

    public getName(): string {
        return this.name;
    }

    public getRefString(): string {
        return this.refString;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, MacroKey)) {
            return false;
        }

        let other = o as MacroKey;

        if (this.name !== other.name) {
            return false;
        }

        if (!ObjectHelper.equals(this.applicationKey, other.applicationKey)) {
            return false;
        }

        return true;
    }

}
