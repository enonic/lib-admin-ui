module api.content.page.region {

    export class PartDescriptor
        extends api.content.page.Descriptor
        implements api.Cloneable {

        public clone(): PartDescriptor {
            return new PartDescriptorBuilder(this).build();
        }

        public static create(): PartDescriptorBuilder {
            return new PartDescriptorBuilder();
        }

        public static fromJson(json: PartDescriptorJson): PartDescriptor {

            return PartDescriptor.create()
                .setKey(api.content.page.DescriptorKey.fromString(json.key))
                .setName(new api.content.page.DescriptorName(json.name))
                .setDisplayName(json.displayName)
                .setConfig(json.config != null ? api.form.Form.fromJson(json.config) : null)
                .build();
        }
    }

    export class PartDescriptorBuilder
        extends api.content.page.DescriptorBuilder {

        constructor(source?: PartDescriptor) {
            super(source);
        }

        public setKey(value: api.content.page.DescriptorKey): PartDescriptorBuilder {
            this.key = value;
            return this;
        }

        public setName(value: api.content.page.DescriptorName): PartDescriptorBuilder {
            this.name = value;
            return this;
        }

        public setDisplayName(value: string): PartDescriptorBuilder {
            this.displayName = value;
            return this;
        }

        public setConfig(value: api.form.Form): PartDescriptorBuilder {
            this.config = value;
            return this;
        }

        public build(): PartDescriptor {
            return new PartDescriptor(this);
        }
    }
}
