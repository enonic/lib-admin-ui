import {SchemaJson} from '../SchemaJson';

export interface ContentTypeSummaryJson
    extends SchemaJson {

    abstract: boolean;

    allowChildContent: boolean;

    displayNameExpression: string;

    displayNamePlaceholder: string;

    final: boolean;

    superType: string;

    owner: string;

    modifier: string;

    metadata: string[];

    allowChildContentType: string[];
}
