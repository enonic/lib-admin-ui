import {Filter} from './Filter';
import {FilterTypeWrapperJson} from './FilterTypeWrapperJson';
import {BooleanFilterJson} from './BooleanFilterJson';

export class BooleanFilter
    extends Filter {

    private must: Filter[] = [];
    private mustNot: Filter[] = [];
    private should: Filter[] = [];

    public addMust(must: Filter): void {
        this.must.push(must);
    }

    public addMustNot(mustNot: Filter): void {
        this.mustNot.push(mustNot);
    }

    public addShould(should: Filter): void {
        this.should.push(should);
    }

    toJson(): FilterTypeWrapperJson {

        let json: BooleanFilterJson = {
            must: this.toJsonWrapperElements(this.must),
            mustNot: this.toJsonWrapperElements(this.mustNot),
            should: this.toJsonWrapperElements(this.should)
        };

        return {
            BooleanFilter: json
        } as FilterTypeWrapperJson;
    }

    toJsonWrapperElements(filters: Filter[]): FilterTypeWrapperJson[] {

        let wrapperJsons: FilterTypeWrapperJson[] = [];

        filters.forEach((filter: Filter) => {
            let filterTypeWrapperJson = filter.toJson();
            wrapperJsons.push(filterTypeWrapperJson);
        });

        return wrapperJsons;
    }

}
