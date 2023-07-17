import {Filter} from './Filter';
import {Value} from '../../data/Value';
import {FilterTypeWrapperJson} from './FilterTypeWrapperJson';
import {RangeFilterJson} from './RangeFilterJson';

export class RangeFilter
    extends Filter {

    private from: Value;
    private to: Value;
    private fieldName: string;

    constructor(fieldName: string, from: Value, to: Value) {
        super();
        this.fieldName = fieldName;
        this.from = from;
        this.to = to;
    }

    toJson(): FilterTypeWrapperJson {

        let json: RangeFilterJson = {
            fieldName: this.fieldName,
            from: this.from != null ? this.from.getString() : null,
            to: this.to != null ? this.to.getString() : null
        };

        return {
            RangeFilter: json
        } as FilterTypeWrapperJson;

    }

}
