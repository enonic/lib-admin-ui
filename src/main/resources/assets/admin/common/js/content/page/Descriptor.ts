module api.content.page {

    export class Descriptor
        implements api.Cloneable, api.Equitable {

        private key: DescriptorKey;

        private name: DescriptorName;

        private displayName: string;

        private description: string;

        private config: api.form.Form;

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

        getConfig(): api.form.Form {
            return this.config;
        }

        getIconCls(): string {
            return '';
        }

        clone(): Descriptor {
            return new DescriptorBuilder(this).build();
        }

        equals(o: api.Equitable): boolean {
            if (!api.ObjectHelper.iFrameSafeInstanceOf(o, Descriptor)) {
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

        config: api.form.Form;

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
                .setConfig(json.config != null ? api.form.Form.fromJson(json.config) : null)
                .setKey(DescriptorKey.fromString(json.key));
        }

        public setKey(value: api.content.page.DescriptorKey): DescriptorBuilder {
            this.key = value;
            return this;
        }

        public setName(value: api.content.page.DescriptorName): DescriptorBuilder {
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

        public setConfig(value: api.form.Form): DescriptorBuilder {
            this.config = value;
            return this;
        }

        public setRegions(_value: api.content.page.region.RegionDescriptor[]): DescriptorBuilder {
            return this;
        }

        public build(): Descriptor {
            return new Descriptor(this);
        }
    }

}
