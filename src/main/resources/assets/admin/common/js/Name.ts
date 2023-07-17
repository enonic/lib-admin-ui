import {Equitable} from './Equitable';
import {StringHelper} from './util/StringHelper';
import {ObjectHelper} from './ObjectHelper';
import {assert, assertNotNull} from './util/Assert';

export class Name
    implements Equitable {

    public static FORBIDDEN_CHARS: RegExp = /[^a-z0-9\-]+/ig;

    public static SIMPLIFIED_FORBIDDEN_CHARS: RegExp = /[\/!?\\]/g;

    private value: string;

    constructor(name: string) {

        assertNotNull(name, 'Name cannot be null');

        assert(!StringHelper.isEmpty(name), 'Name cannot be empty');

        this.value = name;
    }

    getValue(): string {
        return this.value;
    }

    toString(): string {
        return this.value;
    }

    equals(o: Equitable): boolean {

        if (!(ObjectHelper.iFrameSafeInstanceOf(o, Name))) {
            return false;
        }

        let other = o as Name;

        if (this.value !== other.value) {
            return false;
        }

        return true;
    }
}
