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
}
