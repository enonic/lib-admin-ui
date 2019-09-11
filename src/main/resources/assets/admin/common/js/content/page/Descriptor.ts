import {Cloneable} from '../../Cloneable';
import {Equitable} from '../../Equitable';
import {Form} from '../../form/Form';
import {ObjectHelper} from '../../ObjectHelper';
import {DescriptorKey} from './DescriptorKey';
import {DescriptorName} from './DescriptorName';
import {RegionDescriptor} from './region/RegionDescriptor';
import {DescriptorJson} from './DescriptorJson';

export class Descriptor
    implements Cloneable, Equitable {

    private key: DescriptorKey;

    private name: DescriptorName;

    private displayName: string;

    private description: string;

    private config: Form;

    constructor(builder: DescriptorBuilder) {
        this.name = builder.name;
        this.key = builder.key;
        this.displayName = builder.displayName;
        this.description = builder.description;
        this.config = builder.config;
    }

    static fromJson(json: DescriptorJson): Descriptor {
        return DescriptorBuilder.fromJson(json).build();
    }

    getKey(): DescriptorKey {
        return this.key;
    }

    getName(): DescriptorName {
        return this.name;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    getDescription(): string {
        return this.description;
    }

    getConfig(): Form {
        return this.config;
    }

    getIconCls(): string {
        return '';
    }

    clone(): Descriptor {
        return new DescriptorBuilder(this).build();
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, Descriptor)) {
            return false;
        }

        let other = <Descriptor>o;

        return this.name.toString() === other.getName().toString() &&
               this.key.equals(other.getKey()) &&
               this.displayName === other.getDisplayName() &&
               this.description === other.getDescription() &&
               this.config.equals(other.getConfig());
    }
}

export class DescriptorBuilder {

    key: DescriptorKey;

    name: DescriptorName;

    displayName: string;

    description: string;

    config: Form;

    constructor(source?: Descriptor) {
        if (source) {
            this.key = source.getKey();
            this.name = source.getName();
            this.displayName = source.getDisplayName();
            this.description = source.getDescription();
            this.config = source.getConfig();
        }
    }

    static fromJson(json: DescriptorJson): DescriptorBuilder {

        return new DescriptorBuilder()
            .setName(new DescriptorName(json.name))
            .setDisplayName(json.displayName)
            .setDescription(json.description)
            .setConfig(json.config != null ? Form.fromJson(json.config) : null)
            .setKey(DescriptorKey.fromString(json.key));
    }

    public setKey(value: DescriptorKey): DescriptorBuilder {
        this.key = value;
        return this;
    }

    public setName(value: DescriptorName): DescriptorBuilder {
        this.name = value;
        return this;
    }

    public setDisplayName(value: string): DescriptorBuilder {
        this.displayName = value;
        return this;
    }

    public setDescription(value: string): DescriptorBuilder {
        this.description = value;
        return this;
    }

    public setConfig(value: Form): DescriptorBuilder {
        this.config = value;
        return this;
    }

    public setRegions(_value: RegionDescriptor[]): DescriptorBuilder {
        return this;
    }

    public build(): Descriptor {
        return new Descriptor(this);
    }
}
