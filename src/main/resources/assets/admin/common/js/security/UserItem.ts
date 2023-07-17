import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';
import {UserItemJson} from './UserItemJson';
import {UserItemKey} from './UserItemKey';

export abstract class UserItem
    implements Equitable {

    private displayName: string;

    private description: string;

    private key: UserItemKey;

    constructor(builder: UserItemBuilder) {
        this.key = builder.key;
        this.displayName = builder.displayName || '';
        this.description = builder.description;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    getDescription(): string {
        return this.description;
    }

    getKey(): UserItemKey {
        return this.key;
    }

    clone(): UserItem {
        return this.newBuilder().build();
    }

    abstract newBuilder(): UserItemBuilder;

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, UserItem)) {
            return false;
        }

        let other = o as UserItem;

        if (!ObjectHelper.equals(this.key, other.key)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.displayName, other.displayName)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.description, other.description)) {
            return false;
        }

        return true;
    }

}

export abstract class UserItemBuilder {

    displayName: string;

    key: UserItemKey;

    description: string;

    constructor(source?: UserItem) {
        if (source) {
            this.key = source.getKey();
            this.displayName = source.getDisplayName();
            this.description = source.getDescription();
        }
    }

    fromJson(json: UserItemJson): UserItemBuilder {
        this.displayName = json.displayName;
        this.description = json.description || '';
        return this;
    }

    setDisplayName(displayName: string): UserItemBuilder {
        this.displayName = displayName;
        return this;
    }

    setDescription(description: string): UserItemBuilder {
        this.description = description;
        return this;
    }

    abstract build(): UserItem;
}
