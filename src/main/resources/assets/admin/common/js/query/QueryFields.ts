import {QueryField} from './QueryField';

export class QueryFields {

    queryFields: QueryField[] = [];

    add(queryField: QueryField) {
        this.queryFields.push(queryField);
    }

    toString(): string {
        if (this.queryFields) {
            return this.queryFields.join();
        }
    }
}
