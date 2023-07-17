import {BaseItem, BaseItemBuilder} from '../item/BaseItem';
import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';
import {SchemaJson} from './SchemaJson';

export class Schema
    extends BaseItem {

    private name: string;

    private displayName: string;

    private description: string;

    private iconUrl: string;

    constructor(builder: SchemaBuilder) {
        super(builder);
        this.name = builder.name;
        this.displayName = builder.displayName;
        this.description = builder.description;
        this.iconUrl = builder.iconUrl;
    }

    static fromJson(json: SchemaJson): Schema {
        return new SchemaBuilder().fromSchemaJson(json).build();
    }

    getName(): string {
        return this.name;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    getDescription(): string {
        return this.description;
    }

    getIconUrl(): string {
        return this.iconUrl;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, Schema)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        let other = o as Schema;

        if (!ObjectHelper.stringEquals(this.name, other.name)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.displayName, other.displayName)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.iconUrl, other.iconUrl)) {
            return false;
        }

        return true;
    }
}

export class SchemaBuilder
    extends BaseItemBuilder {

    name: string;

    displayName: string;

    description: string;

    iconUrl: string;

    constructor(source?: Schema) {
        super(source);
        if (source) {
            this.name = source.getName();
            this.displayName = source.getDisplayName();
            this.description = source.getDescription();
            this.iconUrl = source.getIconUrl();
        }
    }

    fromSchemaJson(json: SchemaJson): SchemaBuilder {
        super.fromBaseItemJson(json, 'name');

        this.name = json.name;
        this.displayName = json.displayName;
        this.description = json.description;
        this.iconUrl = json.iconUrl;
        return this;
    }

    setName(value: string): SchemaBuilder {
        this.name = value;
        return this;
    }

    setDisplayName(value: string): SchemaBuilder {
        this.displayName = value;
        return this;
    }

    build(): Schema {
        return new Schema(this);
    }
}
