import {TermsAggregationQueryJson} from './TermsAggregationQueryJson';
import {DateRangeAggregationQueryJson} from './DateRangeAggregationQueryJson';

export interface AggregationQueryTypeWrapperJson {

    TermsAggregationQuery?: TermsAggregationQueryJson;
    DateRangeAggregationQuery?: DateRangeAggregationQueryJson;

}
