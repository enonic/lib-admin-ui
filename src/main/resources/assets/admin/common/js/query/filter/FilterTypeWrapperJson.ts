import {RangeFilterJson} from './RangeFilterJson';
import {BooleanFilterJson} from './BooleanFilterJson';

export interface FilterTypeWrapperJson {

    RangeFilter?: RangeFilterJson;
    BooleanFilter?: BooleanFilterJson;

}
