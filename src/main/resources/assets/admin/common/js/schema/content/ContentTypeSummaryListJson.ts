import {SchemaJson} from '../SchemaJson';
import {ContentTypeSummaryJson} from './ContentTypeSummaryJson';

export interface ContentTypeSummaryListJson
    extends SchemaJson {

    total: number;
    totalHits: number;
    hits: number;

    contentTypes: ContentTypeSummaryJson[];
}
