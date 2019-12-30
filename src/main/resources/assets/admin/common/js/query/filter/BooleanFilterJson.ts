import {FilterTypeWrapperJson} from './FilterTypeWrapperJson';

export interface BooleanFilterJson {

    must: FilterTypeWrapperJson[];
    mustNot: FilterTypeWrapperJson[];
    should: FilterTypeWrapperJson[];

}
