import {ContentTypeSummaryJson} from './ContentTypeSummaryJson';
import {SchemaJson} from '../SchemaJson';

export interface ContentTypeSummaryListJson
    extends SchemaJson {

    total: number;
    totalHits: number;
    hits: number;
    contentTypes: ContentTypeSummaryJson[];
}
