module api.content.resource.result {

    import ContentTreeSelectorItemJson = api.content.resource.ContentTreeSelectorItemJson;

    export interface ContentTreeSelectorListJson {

        items: ContentTreeSelectorItemJson[];

        metadata: ContentMetadata;
    }

    export class ContentTreeSelectorListResult<DATA extends ContentTreeSelectorItem> {
        items: DATA[] = [];

        metadata: ContentMetadata;

        constructor(items: DATA[], metadata: ContentMetadata) {
            this.items = items;
            this.metadata = metadata;
        }

        setItems(value: DATA[]): ContentTreeSelectorListResult<DATA> {
            this.items = value;
            return this;
        }

        setMetadata(value: ContentMetadata): ContentTreeSelectorListResult<DATA> {
            this.metadata = value;
            return this;
        }
    }

}
