import {AggregationQuery} from './AggregationQuery';
import {DateRange} from './DateRange';
import {AggregationQueryTypeWrapperJson} from './AggregationQueryTypeWrapperJson';
import {DateRangeAggregationQueryJson} from './DateRangeAggregationQueryJson';

export class DateRangeAggregationQuery
    extends AggregationQuery {

    private fieldName: string;

    private ranges: DateRange[] = [];

    constructor(name: string) {
        super(name);
    }

    public setFieldName(fieldName: string) {
        this.fieldName = fieldName;
    }

    public getFieldName(): string {
        return this.fieldName;
    }

    public addRange(range: DateRange) {

        this.ranges.push(range);
    }

    toJson(): AggregationQueryTypeWrapperJson {

        let json: DateRangeAggregationQueryJson = super.toAggregationQueryJson() as DateRangeAggregationQueryJson;
        json.fieldName = this.getFieldName();
        json.ranges = [];

        this.ranges.forEach((range: DateRange) => {
            json.ranges.push(range.toJson());
        });

        return {
                DateRangeAggregationQuery: json
            } as AggregationQueryTypeWrapperJson;
    }

}
