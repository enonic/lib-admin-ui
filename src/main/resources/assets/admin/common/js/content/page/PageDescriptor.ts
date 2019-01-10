module api.content.page {

    export class PageDescriptor extends DescriptorWithRegions {

        getIconCls(): string {
            return 'file';
        }

        static fromJson(json: DescriptorWithRegionsJson): PageDescriptor {
            return PageDescriptor.create(DescriptorWithRegionsBuilder.fromJson(json));
        }

        private static create(builder: DescriptorWithRegionsBuilder): PageDescriptor {
            return new PageDescriptor(builder);
        }

        clone(): PageDescriptor {
            return new PageDescriptor(new DescriptorWithRegionsBuilder(this));
        }
    }
}
