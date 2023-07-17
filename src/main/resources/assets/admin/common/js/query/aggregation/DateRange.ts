import {DateRangeJson} from './DateRangeJson';
import {Range} from './Range';

export class DateRange
    extends Range {

    private to: string;
    private from: string;

    constructor(from: string, to: string, key?: string) {
        super(key);
        this.from = from;
        this.to = to;
    }

    public setTo(to: string) {
        this.to = to;
    }

    public setFrom(from: string) {
        this.from = from;
    }

    public setToDate(to: Date) {
        this.to = to.toISOString();
    }

    public setFromDate(from: Date) {
        this.from = from.toISOString();
    }

    public toJson(): DateRangeJson {

        let json: DateRangeJson = super.toRangeJson() as DateRangeJson;

        json.from = this.from;
        json.to = this.to;

        return json;
    }
}
