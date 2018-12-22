module api.content.page {

    export class PageDescriptor
        extends Descriptor
        implements api.Cloneable {

        private regions: api.content.page.region.RegionDescriptor[];

        constructor(builder: PageDescriptorBuilder) {
            super(builder);
            this.regions = builder.regions;
        }

        public getRegions(): api.content.page.region.RegionDescriptor[] {
            return this.regions;
        }

        public static create(): PageDescriptorBuilder {
            return new PageDescriptorBuilder();
        }

        public static fromJson(json: api.content.page.PageDescriptorJson): PageDescriptor {

            return PageDescriptor.create()
                .setName(new DescriptorName(json.name))
                .setDisplayName(json.displayName)
                .setDescription(json.description)
                .setConfig(json.config != null ? api.form.Form.fromJson(json.config) : null)
                .setKey(DescriptorKey.fromString(json.key))
                .setRegions(json.regions.map(regionJson => {
                    return api.content.page.region.RegionDescriptor.fromJson(regionJson);
                }))
                .build();
        }

        public clone(): PageDescriptor {
            return new PageDescriptorBuilder(this).build();
        }
    }

    export class PageDescriptorBuilder
        extends DescriptorBuilder {

        regions: api.content.page.region.RegionDescriptor[];

        constructor(source?: PageDescriptor) {
            if (source) {
                super(source);
                this.regions = source.getRegions();
            } else {
                this.regions = [];
            }
        }

        public setKey(key: DescriptorKey): PageDescriptorBuilder {
            this.key = key;
            return this;
        }

        public setName(value: DescriptorName): PageDescriptorBuilder {
            this.name = value;
            return this;
        }

        public setDisplayName(value: string): PageDescriptorBuilder {
            this.displayName = value;
            return this;
        }

        public setDescription(value: string): PageDescriptorBuilder {
            this.description = value;
            return this;
        }

        public setConfig(value: api.form.Form): PageDescriptorBuilder {
            this.config = value;
            return this;
        }

        public addRegion(value: api.content.page.region.RegionDescriptor): PageDescriptorBuilder {
            this.regions.push(value);
            return this;
        }

        public setRegions(value: api.content.page.region.RegionDescriptor[]): PageDescriptorBuilder {
            this.regions = value;
            return this;
        }

        public build(): PageDescriptor {
            return new PageDescriptor(this);
        }
    }
}
