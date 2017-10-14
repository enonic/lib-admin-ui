module api.content.image {

    import TreeNode = api.ui.treegrid.TreeNode;
    import OptionDataLoaderData = api.ui.selector.OptionDataLoaderData;
    import ContentTreeSelectorItem = api.content.resource.ContentTreeSelectorItem;
    import Option = api.ui.selector.Option;
    import GetContentSummaryByIds = api.content.resource.GetContentSummaryByIds;

    export class ImageOptionDataLoader
        extends ContentSummaryOptionDataLoader<ImageTreeSelectorItem> {

        fetch(node: TreeNode<Option<ImageTreeSelectorItem>>): wemQ.Promise<ImageTreeSelectorItem> {
            return super.fetch(node).then((data) => {
                return this.wrapItem(data);
            });
        }

        fetchChildren(parentNode: TreeNode<Option<ImageTreeSelectorItem>>, from: number = 0,
                      size: number = -1): wemQ.Promise<OptionDataLoaderData<ImageTreeSelectorItem>> {
            return super.fetchChildren(parentNode, from, size).then((data: OptionDataLoaderData<ContentTreeSelectorItem>) => {
                    return this.createOptionData(data.getData(), data.getHits(), data.getTotalHits());
                }
            );
        }

        protected sendPreLoadRequest(ids: string): Q.Promise<ImageTreeSelectorItem[]> {
            let contentIds = ids.split(';').map((id) => {
                return new ContentId(id);
            });
            return new GetContentSummaryByIds(contentIds).sendAndParse().then(((contents: ContentSummary[]) => {
                return contents.map(content => new ImageTreeSelectorItem(content, false));
            }));
        }

        protected createOptionData(data: ContentTreeSelectorItem[], hits: number, totalHits: number) {
            return new OptionDataLoaderData(this.wrapItems(data),
                hits,
                totalHits);
        }

        notifyLoadedData(data: ContentTreeSelectorItem[] = [], postLoad?: boolean, silent: boolean = false) {
            const items = this.wrapItems(data);

            super.notifyLoadedData(items, postLoad, silent);
        }

        private wrapItems(items: ContentTreeSelectorItem[] = []): ImageTreeSelectorItem[] {
            return items.map(item =>
                new ImageTreeSelectorItem(item.getContent(), item.isSelectable(), item.isExpandable())
            );
        }

        private wrapItem(item: ContentTreeSelectorItem): ImageTreeSelectorItem {
            return item ? new ImageTreeSelectorItem(item.getContent(), item.isSelectable(), item.isExpandable()) : null;
        }

        static create(): ImageOptionDataLoaderBuilder {
            return new ImageOptionDataLoaderBuilder();
        }
    }

    export class ImageOptionDataLoaderBuilder
        extends ContentSummaryOptionDataLoaderBuilder {

        inputName: string;

        public setInputName(value: string): ImageOptionDataLoaderBuilder {
            this.inputName = value;
            return this;
        }

        setContentTypeNames(value: string[]): ImageOptionDataLoaderBuilder {
            super.setContentTypeNames(value);
            return this;
        }

        public setAllowedContentPaths(value: string[]): ImageOptionDataLoaderBuilder {
            super.setAllowedContentPaths(value);
            return this;
        }

        public setRelationshipType(value: string): ImageOptionDataLoaderBuilder {
            super.setRelationshipType(value);
            return this;
        }

        public setContent(value: ContentSummary): ImageOptionDataLoaderBuilder {
            super.setContent(value);
            return this;
        }

        build(): ImageOptionDataLoader {
            return new ImageOptionDataLoader(this);
        }
    }

    export class ImageTreeSelectorItem
        extends ContentTreeSelectorItem {

        private imageSelectorDisplayValue: ImageSelectorDisplayValue;

        constructor(content: ContentSummary, selectable?: boolean, expandable?: boolean) {
            super(content, selectable, expandable);
            this.imageSelectorDisplayValue =
                !!content ? ImageSelectorDisplayValue.fromContentSummary(content) : ImageSelectorDisplayValue.makeEmpty();
        }

        setDisplayValue(value: ImageSelectorDisplayValue): ImageTreeSelectorItem {
            this.imageSelectorDisplayValue = value;
            return this;
        }

        getImageUrl(): string {
            return this.imageSelectorDisplayValue.getImageUrl();
        }

        isEmptyContent(): boolean {
            return this.imageSelectorDisplayValue.isEmptyContent();
        }

        getContentSummary(): ContentSummary {
            return this.imageSelectorDisplayValue.getContentSummary();
        }

        getTypeLocaleName(): string {
            return this.imageSelectorDisplayValue.getTypeLocaleName();
        }

        getId(): string {
            return this.imageSelectorDisplayValue.getId();
        }

        getContentId(): api.content.ContentId {
            return this.imageSelectorDisplayValue.getContentId();
        }

        getContentPath(): api.content.ContentPath {
            return this.imageSelectorDisplayValue.getContentPath();
        }

        getPath(): api.content.ContentPath {
            return this.imageSelectorDisplayValue.getPath();
        }

        equals(o: api.Equitable): boolean {

            if (!api.ObjectHelper.iFrameSafeInstanceOf(o, api.ClassHelper.getClass(this))) {
                return false;
            }

            if (!super.equals(o)) {
                return false;
            }

            let other = <ImageTreeSelectorItem>o;

            if (!ObjectHelper.equals(this.imageSelectorDisplayValue, other.imageSelectorDisplayValue)) {
                return false;
            }

            return true;
        }
    }
}
