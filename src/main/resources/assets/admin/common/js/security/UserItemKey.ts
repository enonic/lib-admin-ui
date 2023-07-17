import {Equitable} from '../Equitable';
import {StringHelper} from '../util/StringHelper';
import {ObjectHelper} from '../ObjectHelper';
import {assert} from '../util/Assert';

export class UserItemKey
    implements Equitable {

    private id: string;

    constructor(id: string) {
        assert(!StringHelper.isBlank(id), 'Id cannot be null or empty');
        this.id = id;
    }

    static fromString(_str: string): UserItemKey {
        throw Error('Override me');
    }

    isSystem(): boolean {
        throw Error('Must be overridden by inheritors');
    }

    getId(): string {
        return this.id;
    }

    toString(): string {
        return this.id;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, UserItemKey)) {
            return false;
        }

        let other = o as UserItemKey;
        return this.id === other.id;
    }

}
