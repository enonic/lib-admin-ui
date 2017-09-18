module api.content {

    import OptionDataLoader = api.ui.selector.OptionDataLoader;
    import TreeNode = api.ui.treegrid.TreeNode;
    import ContentSummaryFetcher = api.content.resource.ContentSummaryFetcher;
    import OptionDataLoaderData = api.ui.selector.OptionDataLoaderData;
    import ContentResponse = api.content.resource.result.ContentResponse;
    import Option = api.ui.selector.Option;
    import ContentTreeSelectorItem = api.content.resource.ContentTreeSelectorItem;
    import CompareContentRequest = api.content.resource.CompareContentRequest;
    import CompareContentResults = api.content.resource.result.CompareContentResults;
    import ContentSummaryAndCompareStatusFetcher = api.content.resource.ContentSummaryAndCompareStatusFetcher;
    import ContentAndStatusTreeSelectorItem = api.content.resource.ContentAndStatusTreeSelectorItem;
    import CompareContentResult = api.content.resource.result.CompareContentResult;
    import ContentSelectorQueryRequest = api.content.resource.ContentSelectorQueryRequest;

    export class ContentSummaryOptionDataLoader<DATA extends ContentTreeSelectorItem>
        extends OptionDataLoader<DATA> {

        protected request: ContentTreeSelectorQueryRequest<DATA>;

        private loadStatus: boolean;

        private loadModeChangedListeners: { (isFlat: boolean): void }[] = [];

        constructor(builder?: ContentSummaryOptionDataLoaderBuilder) {
            super();

            if (builder) {
                this.loadStatus = builder.loadStatus;

                this.initRequest(builder);
            }
        }

        protected createRequest(): ContentTreeSelectorQueryRequest<DATA> {

            return new ContentTreeSelectorQueryRequest<DATA>();
        }

        private initRequest(builder: ContentSummaryOptionDataLoaderBuilder) {
            this.request.setContentTypeNames(builder.contentTypeNames);
            this.request.setAllowedContentPaths(builder.allowedContentPaths);
            this.request.setRelationshipType(builder.relationshipType);
            this.request.setContent(builder.content);
        }

        setContent(content: ContentSummary) {
            this.request.setContent(content);
        }

        search(value: string): wemQ.Promise<DATA[]> {
            this.notifyLoadingData();

            const req = new ContentSelectorQueryRequest();
            req.setContent(this.request.getContent());
            req.setAllowedContentPaths(this.request.getAllowedContentPaths());
            req.setContentTypeNames(this.request.getContentTypeNames());
            req.setFrom(this.request.getFrom());
            req.setSize(this.request.getSize());
            req.setInputName(this.request.getInputName());
            req.setRelationshipType(this.request.getRelationshipType());
            req.setQueryExpr(value);

            return req.sendAndParse().then((contents: ContentSummary[]) => {

                const result = contents.map(
                    content => new ContentTreeSelectorItem(content, false));

                this.notifyLoadModeChanged(true);

                this.notifyLoadedData(<DATA[]>result);
                return <DATA[]>result;
            });
        }

        load(postLoad: boolean = false): wemQ.Promise<DATA[]> {
            this.request.setParentPath(null);
            this.notifyLoadingData();
            return this.loadItems().then(data => {

                this.notifyLoadModeChanged(false);

                this.notifyLoadedData(data);
                return data;
            });
        }

        fetch(node: TreeNode<Option<DATA>>): wemQ.Promise<DATA> {
            this.request.setParentPath(node.getDataId() ? node.getData().displayValue.getPath() : null);
            if (this.request.getContent()) {
                return this.loadItems().then(items => items[0]);
            }

            if (this.loadStatus) {
                return ContentSummaryAndCompareStatusFetcher.fetch(node.getData().displayValue.getContentId()).then(
                    content => <any>new ContentAndStatusTreeSelectorItem(content, false));
            }

            return ContentSummaryFetcher.fetch(node.getData().displayValue.getContentId()).then(
                content => <any>new ContentTreeSelectorItem(content, false));
        }

        fetchChildren(parentNode: TreeNode<Option<DATA>>, from: number = 0,
                      size: number = -1): wemQ.Promise<OptionDataLoaderData<DATA>> {

            if (this.request.getContent()) {
                this.request.setFrom(from);
                this.request.setSize(size);

                this.request.setParentPath(parentNode.getDataId() ? parentNode.getData().displayValue.getPath() : null);

                return this.loadItems().then((result: DATA[]) => {
                    return this.createOptionData(result, 0, 0);
                });
            }

            if (this.loadStatus) {
                return ContentSummaryAndCompareStatusFetcher.fetchChildren(
                    parentNode.getData() ? parentNode.getData().displayValue.getContentId() : null, from, size).then(
                    (response: ContentResponse<ContentSummaryAndCompareStatus>) => {

                        const result = response.getContents().map(
                            content => new ContentAndStatusTreeSelectorItem(content, false));

                        return this.createOptionData(<any[]>result,
                            response.getMetadata().getHits(),
                            response.getMetadata().getTotalHits());
                    });
            }

            return ContentSummaryFetcher.fetchChildren(
                parentNode.getData() ? parentNode.getData().displayValue.getContentId() : null, from, size).then(
                (response: ContentResponse<ContentSummary>) => {

                    const result = response.getContents().map(
                        content => new ContentTreeSelectorItem(content, false));
                    //         this.notifyLoadedData(result);

                    return this.createOptionData(<DATA[]>result, response.getMetadata().getHits(), response.getMetadata().getTotalHits());
                });
        }

        protected createOptionData(data: DATA[], hits: number,
                                   totalHits: number): OptionDataLoaderData<DATA> {
            return new OptionDataLoaderData<DATA>(data, hits, totalHits);
        }

        checkReadonly(items: DATA[]): wemQ.Promise<string[]> {
            return ContentSummaryFetcher.getReadOnly(items.map(item => item.getContent()));
        }

        private loadItems(): wemQ.Promise<DATA[]> {
            return this.request.sendAndParse().then(items => {
                if (this.loadStatus) {
                    return this.loadStatuses(items);
                }

                const deferred = wemQ.defer<DATA[]>();

                deferred.resolve(items.map((item: DATA) => {
                    return <any> new ContentTreeSelectorItem(item.getContent(), item.getExpand());
                }));

                return deferred.promise;
            });
        }

        private loadStatuses(contents: DATA[]): wemQ.Promise<DATA[]> {
            return CompareContentRequest.fromContentSummaries(contents.map(item => item.getContent())).sendAndParse().then(
                (compareResults: CompareContentResults) => {

                    return contents.map(item => {

                        const compareResult: CompareContentResult = compareResults.get(item.getId());
                        const contentAndCompareStatus = ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(
                            item.getContent(), compareResult.getCompareStatus(), compareResult.getPublishStatus());

                        return <any>new ContentAndStatusTreeSelectorItem(contentAndCompareStatus, item.getExpand());
                    });
                });
        }

        private notifyLoadModeChanged(isFlat: boolean) {
            this.loadModeChangedListeners.forEach((listener: (isFlat: boolean) => void) => {
                listener(isFlat);
            });
        }

        onLoadModeChanged(listener: (isFlat: boolean) => void) {
            this.loadModeChangedListeners.push(listener);
        }

        unLoadModeChanged(listener: (isFlat: boolean) => void) {
            this.loadModeChangedListeners = this.loadModeChangedListeners
                .filter(function (curr: (isFlat: boolean) => void) {
                    return curr !== listener;
                });
        }

        static create(): ContentSummaryOptionDataLoaderBuilder {
            return new ContentSummaryOptionDataLoaderBuilder();
        }
    }

    export class ContentSummaryOptionDataLoaderBuilder {

        content: ContentSummary;

        contentTypeNames: string[] = [];

        allowedContentPaths: string[] = [];

        relationshipType: string;

        loadStatus: boolean;

        public setContentTypeNames(contentTypeNames: string[]): ContentSummaryOptionDataLoaderBuilder {
            this.contentTypeNames = contentTypeNames;
            return this;
        }

        public setAllowedContentPaths(allowedContentPaths: string[]): ContentSummaryOptionDataLoaderBuilder {
            this.allowedContentPaths = allowedContentPaths;
            return this;
        }

        public setRelationshipType(relationshipType: string): ContentSummaryOptionDataLoaderBuilder {
            this.relationshipType = relationshipType;
            return this;
        }

        public setContent(content: ContentSummary): ContentSummaryOptionDataLoaderBuilder {
            this.content = content;
            return this;
        }

        public setLoadStatus(value: boolean): ContentSummaryOptionDataLoaderBuilder {
            this.loadStatus = value;
            return this;
        }

        build(): ContentSummaryOptionDataLoader<ContentTreeSelectorItem> {
            return new ContentSummaryOptionDataLoader(this);
        }
    }
}
