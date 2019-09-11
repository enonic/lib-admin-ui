import {RegionsDescriptorJson} from './region/RegionsDescriptorJson';
import {DescriptorJson} from './DescriptorJson';

export interface DescriptorWithRegionsJson
    extends DescriptorJson {

    regions: RegionsDescriptorJson[];

}
