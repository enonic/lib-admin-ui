module api.content.page.region {

    export class PartDescriptor extends Descriptor {

        getIconCls(): string {
            return 'part';
        }

        static fromJson(json: DescriptorJson): PartDescriptor {
            return PartDescriptor.create(DescriptorBuilder.fromJson(json));
        }

        private static create(builder: DescriptorBuilder): PartDescriptor {
            return new PartDescriptor(builder);
        }

        clone(): PartDescriptor {
            return new PartDescriptor(new DescriptorBuilder(this));
        }
    }

}
