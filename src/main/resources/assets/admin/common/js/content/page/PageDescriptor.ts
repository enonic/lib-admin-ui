import {DescriptorWithRegions, DescriptorWithRegionsBuilder} from './DescriptorWithRegions';
import {DescriptorWithRegionsJson} from './DescriptorWithRegionsJson';

export class PageDescriptor
    extends DescriptorWithRegions {

    static fromJson(json: DescriptorWithRegionsJson): PageDescriptor {
        return PageDescriptor.create(DescriptorWithRegionsBuilder.fromJson(json));
    }

    private static create(builder: DescriptorWithRegionsBuilder): PageDescriptor {
        return new PageDescriptor(builder);
    }

    getIconCls(): string {
        return 'file';
    }

    clone(): PageDescriptor {
        return new PageDescriptor(new DescriptorWithRegionsBuilder(this));
    }
}
