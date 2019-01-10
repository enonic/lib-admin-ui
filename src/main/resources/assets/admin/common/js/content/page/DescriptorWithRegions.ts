module api.content.page {

    import RegionDescriptor = api.content.page.region.RegionDescriptor;

    export class DescriptorWithRegions extends Descriptor {

        private regions: RegionDescriptor[];

        constructor(builder: DescriptorWithRegionsBuilder) {
            super(<DescriptorBuilder>builder);
            this.regions = builder.regions;
        }

        static fromJson(json: DescriptorWithRegionsJson): DescriptorWithRegions {
            return DescriptorWithRegionsBuilder.fromJson(json).build();
        }

        public getRegions(): RegionDescriptor[] {
            return this.regions;
        }

        clone(): DescriptorWithRegions {
            return new DescriptorWithRegionsBuilder(this).build();
        }
    }

    export class DescriptorWithRegionsBuilder extends DescriptorBuilder {

        regions: RegionDescriptor[] = [];

        constructor(source?: DescriptorWithRegions) {
            super(source);
            if (source) {
                this.regions = source.getRegions();
            }
        }

        public setRegions(value: RegionDescriptor[]): DescriptorWithRegionsBuilder {
            this.regions = value;
            return this;
        }

        public build(): DescriptorWithRegions {
            return new DescriptorWithRegions(this);
        }

        static fromJson(json: DescriptorWithRegionsJson): DescriptorWithRegionsBuilder {
            const builder: DescriptorWithRegionsBuilder = (<DescriptorWithRegionsBuilder>super.fromJson(json));

            builder.regions = json.regions.map(regionJson => {
                return api.content.page.region.RegionDescriptor.fromJson(regionJson);
            });

            return builder;
        }
    }
}
