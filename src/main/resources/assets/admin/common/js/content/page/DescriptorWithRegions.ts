import {RegionDescriptor} from './region/RegionDescriptor';
import {Equitable} from '../../Equitable';
import {ObjectHelper} from '../../ObjectHelper';
import {Descriptor, DescriptorBuilder} from './Descriptor';
import {DescriptorWithRegionsJson} from './DescriptorWithRegionsJson';
import {PageDescriptor} from './PageDescriptor';

export class DescriptorWithRegions
    extends Descriptor
    implements Equitable {

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

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, PageDescriptor)) {
            return false;
        }

        let other = <PageDescriptor>o;

        return super.equals(other) && ObjectHelper.arrayEquals(this.regions, other.getRegions());
    }
}

export class DescriptorWithRegionsBuilder
    extends DescriptorBuilder {

    regions: RegionDescriptor[] = [];

    constructor(source?: DescriptorWithRegions) {
        super(source);
        if (source) {
            this.regions = source.getRegions();
        }
    }

    static fromJson(json: DescriptorWithRegionsJson): DescriptorWithRegionsBuilder {
        const builder: DescriptorWithRegionsBuilder = (<DescriptorWithRegionsBuilder>super.fromJson(json));

        builder.regions = json.regions.map(regionJson => {
            return RegionDescriptor.fromJson(regionJson);
        });

        return builder;
    }

    public setRegions(value: RegionDescriptor[]): DescriptorWithRegionsBuilder {
        this.regions = value;
        return this;
    }

    public build(): DescriptorWithRegions {
        return new DescriptorWithRegions(this);
    }
}
