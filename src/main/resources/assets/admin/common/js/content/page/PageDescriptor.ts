import {DescriptorWithRegions, DescriptorWithRegionsBuilder} from './DescriptorWithRegions';
import {DescriptorWithRegionsJson} from './DescriptorWithRegionsJson';
import {Equitable} from '../../Equitable';
import {ObjectHelper} from '../../ObjectHelper';

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

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, PageDescriptor)) {
            return false;
        }

        return super.equals(o);
    }
}
