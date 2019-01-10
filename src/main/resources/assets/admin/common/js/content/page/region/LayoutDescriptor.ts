module api.content.page.region {

    export class LayoutDescriptor extends DescriptorWithRegions {

        getIconCls(): string {
            return 'layout';
        }

        static fromJson(json: DescriptorWithRegionsJson): LayoutDescriptor {
            return LayoutDescriptor.create(DescriptorWithRegionsBuilder.fromJson(json));
        }

        private static create(builder: DescriptorWithRegionsBuilder): LayoutDescriptor {
            return new LayoutDescriptor(builder);
        }

        clone(): LayoutDescriptor {
            return new LayoutDescriptor(new DescriptorWithRegionsBuilder(this));
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
