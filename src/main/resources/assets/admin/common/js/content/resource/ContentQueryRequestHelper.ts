module api.content.resource {

    import ValueExpr = api.query.expr.ValueExpr;
    import QueryExpr = api.query.expr.QueryExpr;
    import CompareExpr = api.query.expr.CompareExpr;
    import FieldExpr = api.query.expr.FieldExpr;
    import QueryField = api.query.QueryField;
    import ContentQueryRequest = api.content.resource.ContentQueryRequest;
    import ContentSummaryJson = api.content.json.ContentSummaryJson;
    import ContentQueryResult = api.content.resource.result.ContentQueryResult;
    import ContentQuery = api.content.query.ContentQuery;

    export class ContentQueryRequestHelper {

        public static anyIsOutboundDependency(sourceContentId: ContentId, contentIds: ContentId[]): wemQ.Promise<boolean> {
            const values = contentIds.map(contentId => ValueExpr.string(contentId.toString()));

            const contentQuery: ContentQuery = new ContentQuery();
            contentQuery.setMustBeReferencedById(sourceContentId);
            contentQuery.setQueryExpr(new QueryExpr(CompareExpr.In(new FieldExpr(QueryField.ID), values)));

            return new ContentQueryRequest<ContentSummaryJson, ContentSummary>(contentQuery).sendAndParse().then(
                (contentQueryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
                    return contentQueryResult.getMetadata().getTotalHits() > 0;
                });
        }
    }

}
