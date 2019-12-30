import {DateRangeJson} from './DateRangeJson';

export interface DateRangeAggregationQueryJson {

    name: string;
    fieldName: string;
    ranges: DateRangeJson[];

}
