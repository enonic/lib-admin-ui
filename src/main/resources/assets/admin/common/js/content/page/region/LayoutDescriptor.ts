module api.content.page.region {

    export class LayoutDescriptor
        extends api.content.page.Descriptor
        implements api.Cloneable {
        private regions: RegionDescriptor[];

        constructor(builder: LayoutDescriptorBuilder) {
            super(builder);
            this.regions = builder.regions;
        }

        public getRegions(): RegionDescriptor[] {
            return this.regions;
        }

        public clone(): LayoutDescriptor {
            return new LayoutDescriptorBuilder(this).build();
        }

        public static create(): LayoutDescriptorBuilder {
            return new LayoutDescriptorBuilder();
        }

        public static fromJson(json: LayoutDescriptorJson): LayoutDescriptor {

            return LayoutDescriptor.create().setKey(api.content.page.DescriptorKey.fromString(json.key))
                .setName(new api.content.page.DescriptorName(json.name))
                .setDisplayName(json.displayName)
                .setDescription(json.description)
                .setConfig(json.config != null ? api.form.Form.fromJson(json.config) : null)
                .setRegions(json.regions.map(regionJson => {
                    return api.content.page.region.RegionDescriptor.fromJson(regionJson);
                }))
                .build();
        }
    }

    export class LayoutDescriptorBuilder
        extends api.content.page.DescriptorBuilder {

        regions: RegionDescriptor[] = [];

        constructor(source?: LayoutDescriptor) {
            super(source);
            if (source) {
                this.regions = source.getRegions();
            }
        }

        public setKey(value: api.content.page.DescriptorKey): LayoutDescriptorBuilder {
            this.key = value;
            return this;
        }

        public setName(value: api.content.page.DescriptorName): LayoutDescriptorBuilder {
            this.name = value;
            return this;
        }

        public setDisplayName(value: string): LayoutDescriptorBuilder {
            this.displayName = value;
            return this;
        }

        public setDescription(value: string): LayoutDescriptorBuilder {
            this.description = value;
            return this;
        }

        public setConfig(value: api.form.Form): LayoutDescriptorBuilder {
            this.config = value;
            return this;
        }

        public addRegion(value: RegionDescriptor): LayoutDescriptorBuilder {
            this.regions.push(value);
            return this;
        }

        public setRegions(value: region.RegionDescriptor[]): LayoutDescriptorBuilder {
            this.regions = value;
            return this;
        }

        public build(): LayoutDescriptor {
            return new LayoutDescriptor(this);
        }
    }
}
