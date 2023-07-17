import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';
import {PrincipalJson} from './PrincipalJson';
import {UserItem, UserItemBuilder} from './UserItem';
import {PrincipalType} from './PrincipalType';
import {PrincipalKey} from './PrincipalKey';

export class Principal
    extends UserItem {

    private type: PrincipalType;

    private modifiedTime: Date;

    constructor(builder: PrincipalBuilder) {
        super(builder);
        this.type = (builder.key as PrincipalKey).getType();
        this.modifiedTime = builder.modifiedTime;
    }

    static fromPrincipal(principal: Principal): Principal {
        return new PrincipalBuilder(principal).build();
    }

    static create(): PrincipalBuilder {
        return new PrincipalBuilder();
    }

    static fromJson(json: PrincipalJson): Principal {
        return new PrincipalBuilder().fromJson(json).build();
    }

    toJson(): PrincipalJson {
        return {
            displayName: this.getDisplayName(),
            key: this.getKey().toString()
        };
    }

    getType(): PrincipalType {
        return this.type;
    }

    getKey(): PrincipalKey {
        return super.getKey() as PrincipalKey;
    }

    getTypeName(): string {
        switch (this.type) {
        case PrincipalType.GROUP:
            return 'Group';
        case PrincipalType.USER:
            return 'User';
        case PrincipalType.ROLE:
            return 'Role';
        default:
            return '';
        }
    }

    isUser(): boolean {
        return this.type === PrincipalType.USER;
    }

    isGroup(): boolean {
        return this.type === PrincipalType.GROUP;
    }

    isRole(): boolean {
        return this.type === PrincipalType.ROLE;
    }

    getModifiedTime(): Date {
        return this.modifiedTime;
    }

    isSystem(): boolean {
        return this.getKey().isSystem();
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, Principal)) {
            return false;
        }

        let other = o as Principal;

        if (!super.equals(o)) {
            return false;
        }

        if (!ObjectHelper.dateEquals(this.modifiedTime, other.modifiedTime)) {
            return false;
        }

        return true;
    }

    clone(): Principal {
        return this.newBuilder().build();
    }

    newBuilder(): PrincipalBuilder {
        return new PrincipalBuilder(this);
    }
}

export class PrincipalBuilder
    extends UserItemBuilder {

    modifiedTime: Date;

    constructor(source?: Principal) {
        super(source);
        if (source) {
            this.modifiedTime = source.getModifiedTime();
        }
    }

    fromJson(json: PrincipalJson): PrincipalBuilder {
        super.fromJson(json);
        this.key = this.getKeyFromJson(json);
        this.modifiedTime = json.modifiedTime ? new Date(Date.parse(json.modifiedTime)) : null;
        return this;
    }

    setKey(key: PrincipalKey): PrincipalBuilder {
        this.key = key;
        return this;
    }

    setModifiedTime(modifiedTime: Date): PrincipalBuilder {
        this.modifiedTime = modifiedTime;
        return this;
    }

    setDisplayName(displayName: string): PrincipalBuilder {
        super.setDisplayName(displayName);
        return this;
    }

    setDescription(description: string): PrincipalBuilder {
        super.setDescription(description);
        return this;
    }

    build(): Principal {
        return new Principal(this);
    }

    protected getKeyFromJson(json: PrincipalJson): PrincipalKey {
        return json.key ? PrincipalKey.fromString(json.key) : null;
    }
}
