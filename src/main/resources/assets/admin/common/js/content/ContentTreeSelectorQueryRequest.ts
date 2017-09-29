module api.content {

    import QueryExpr = api.query.expr.QueryExpr;
    import Expression = api.query.expr.Expression;
    import QueryField = api.query.QueryField;
    import ContentResourceRequest = api.content.resource.ContentResourceRequest;
    import ContentTreeSelectorItem = api.content.resource.ContentTreeSelectorItem;
    import ContentSelectorQueryRequest = api.content.resource.ContentSelectorQueryRequest;
    import ContentTreeSelectorItemJson = api.content.resource.ContentTreeSelectorItemJson;
    import ChildOrder = api.content.order.ChildOrder;

    export class ContentTreeSelectorQueryRequest<DATA extends ContentTreeSelectorItem> extends
        ContentResourceRequest<any, DATA[]> {

        private queryExpr: api.query.expr.QueryExpr;

        private from: number = 0;

        private size: number = -1;//ContentTreeSelectorQueryRequest.DEFAULT_SIZE;

        private expand: api.rest.Expand = api.rest.Expand.SUMMARY;

        private content: ContentSummary;

        private inputName: string;

        private contentTypeNames: string[] = [];

        private allowedContentPaths: string[] = [];

        private relationshipType: string;

        private loaded: boolean;

        private results: ContentSummary[] = [];

        private parentPath: ContentPath;

        private childOrder: ChildOrder;

        constructor() {
            super();
            super.setMethod('POST');

            this.setQueryExpr();
        }

        setInputName(name: string) {
            this.inputName = name;
        }

        getInputName(): string {
            return this.inputName;
        }

        setContent(content: ContentSummary) {
            this.content = content;
            this.setQueryExpr();
        }

        getContent(): ContentSummary {
            return this.content;
        }

        setFrom(from: number) {
            this.from = from;
        }

        getFrom(): number {
            return this.from;
        }

        setSize(size: number) {
            this.size = size;
        }

        getSize(): number {
            return this.size;
        }

        setContentTypeNames(contentTypeNames: string[]) {
            this.contentTypeNames = contentTypeNames;
        }

        setAllowedContentPaths(allowedContentPaths: string[]) {
            this.allowedContentPaths = allowedContentPaths;
        }

        setRelationshipType(relationshipType: string) {
            this.relationshipType = relationshipType;
        }

        setQueryExpr(searchString: string = '') {
            let fulltextExpression = this.createSearchExpression(searchString);

            this.queryExpr = new QueryExpr(fulltextExpression, ContentSelectorQueryRequest.DEFAULT_ORDER);
        }

        setParentContent(content: ContentSummary) {
            this.parentPath = content ? content.getPath() : null;
            this.childOrder = content ? content.getChildOrder() : null;
        }

        protected createSearchExpression(searchString: string): Expression {
            return new api.query.PathMatchExpressionBuilder()
                .setSearchString(searchString)
                .setPath(this.content ? this.content.getPath().toString() : '')
                .addField(new QueryField(QueryField.DISPLAY_NAME, 5))
                .addField(new QueryField(QueryField.NAME, 3))
                .addField(new QueryField(QueryField.ALL))
                .build();
        }

        getAllowedContentPaths(): string[] {
            return this.allowedContentPaths;
        }

        getContentTypeNames(): string[] {
            return this.contentTypeNames;
        }

        getRelationshipType(): string {
            return this.relationshipType;
        }

        getQueryExpr(): api.query.expr.QueryExpr {
            return this.queryExpr;
        }

        getRequestPath(): api.rest.Path {
            return api.rest.Path.fromParent(super.getResourcePath(), 'treeSelectorQuery');
        }

        isPartiallyLoaded(): boolean {
            return this.results.length > 0 && !this.loaded;
        }

        isLoaded(): boolean {
            return this.loaded;
        }

        resetParams() {
            this.from = 0;
            this.loaded = false;
        }

        getParams(): Object {
            let queryExprAsString = this.getQueryExpr() ? this.getQueryExpr().toString() : '';

            return {
                queryExpr: queryExprAsString,
                from: this.getFrom(),
                size: this.getSize(),
                expand: this.expandAsString(),
                contentId: this.content ? this.content.getId().toString() : null,
                inputName: this.getInputName(),
                contentTypeNames: this.contentTypeNames,
                allowedContentPaths: this.allowedContentPaths,
                relationshipType: this.relationshipType,
                parentPath: this.parentPath ? this.parentPath.toString() : null,
                childOrder: this.childOrder ? this.childOrder.toString() : ''
            };
        }

        sendAndParse(): wemQ.Promise<DATA[]> {
            return this.send().then((response: api.rest.JsonResponse<ContentTreeSelectorItemJson[]>) => {
                if (response.getResult() && response.getResult().length > 0) {
                    return response.getResult().map(json => <any>ContentTreeSelectorItem.fromJson(json));
                } else {
                    return [];
                }
            });
        }

        private expandAsString(): string {
            switch (this.expand) {
            case api.rest.Expand.FULL:
                return 'full';
            case api.rest.Expand.SUMMARY:
                return 'summary';
            case api.rest.Expand.NONE:
                return 'none';
            default:
                return 'summary';
            }
        }
    }
}
