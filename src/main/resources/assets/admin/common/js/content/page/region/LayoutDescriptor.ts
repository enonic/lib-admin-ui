import {DescriptorWithRegions, DescriptorWithRegionsBuilder} from '../DescriptorWithRegions';
import {DescriptorWithRegionsJson} from '../DescriptorWithRegionsJson';

export class LayoutDescriptor
    extends DescriptorWithRegions {

    static fromJson(json: DescriptorWithRegionsJson): LayoutDescriptor {
        return LayoutDescriptor.create(DescriptorWithRegionsBuilder.fromJson(json));
    }

    private static create(builder: DescriptorWithRegionsBuilder): LayoutDescriptor {
        return new LayoutDescriptor(builder);
    }

    getIconCls(): string {
        return 'layout';
    }

    clone(): LayoutDescriptor {
        return new LayoutDescriptor(new DescriptorWithRegionsBuilder(this));
    }

}
