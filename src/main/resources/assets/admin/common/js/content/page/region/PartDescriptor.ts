import {Descriptor, DescriptorBuilder} from '../Descriptor';
import {DescriptorJson} from '../DescriptorJson';

export class PartDescriptor
    extends Descriptor {

    static fromJson(json: DescriptorJson): PartDescriptor {
        return PartDescriptor.create(DescriptorBuilder.fromJson(json));
    }

    private static create(builder: DescriptorBuilder): PartDescriptor {
        return new PartDescriptor(builder);
    }

    getIconCls(): string {
        return 'part';
    }

    clone(): PartDescriptor {
        return new PartDescriptor(new DescriptorBuilder(this));
    }
}
