module api.schema.content {

    export interface ContentTypeSummaryJson extends api.schema.SchemaJson {

        abstract:boolean;

        allowChildContent:boolean;

        displayNameExpression: string;

        final: boolean;

        superType:string;

        owner:string;

        modifier:string;

        metadata:string[];
    }
}
