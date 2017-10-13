module api.content {

    import UploadItem = api.ui.uploader.UploadItem;

    export class ContentSummaryAndCompareStatus implements api.Equitable {

        private uploadItem: UploadItem<ContentSummary>;

        private contentSummary: ContentSummary;

        private compareStatus: CompareStatus;

        private publishStatus: PublishStatus;

        private readOnly: boolean;

        public static fromContentSummary(contentSummary: ContentSummary) {
            return new ContentSummaryAndCompareStatus().setContentSummary(contentSummary);
        }

        public static fromContentAndCompareStatus(contentSummary: ContentSummary, compareStatus: CompareStatus) {
            return new ContentSummaryAndCompareStatus().setContentSummary(contentSummary).setCompareStatus(compareStatus);
        }

        public static fromContentAndCompareAndPublishStatus(contentSummary: ContentSummary, compareStatus: CompareStatus,
                                                            publishStatus: PublishStatus) {
            return new ContentSummaryAndCompareStatus().setContentSummary(contentSummary).setCompareStatus(compareStatus).setPublishStatus(
                publishStatus);
        }

        public static fromUploadItem(item: UploadItem<ContentSummary>): ContentSummaryAndCompareStatus {
            return new ContentSummaryAndCompareStatus().setUploadItem(item);
        }

        getContentSummary(): ContentSummary {
            return this.contentSummary;
        }

        setContentSummary(contentSummary: ContentSummary): ContentSummaryAndCompareStatus {
            this.contentSummary = contentSummary;
            return this;
        }

        getCompareStatus(): CompareStatus {
            return this.compareStatus;
        }

        setCompareStatus(status: CompareStatus): ContentSummaryAndCompareStatus {
            this.compareStatus = status;
            return this;
        }

        getPublishStatus(): PublishStatus {
            return this.publishStatus;
        }

        setPublishStatus(publishStatus: PublishStatus): ContentSummaryAndCompareStatus {
            this.publishStatus = publishStatus;
            return this;
        }

        getUploadItem(): UploadItem<ContentSummary> {
            return this.uploadItem;
        }

        setUploadItem(item: UploadItem<ContentSummary>): ContentSummaryAndCompareStatus {
            this.uploadItem = item;
            if (item.isUploaded()) {
                this.contentSummary = item.getModel();
            } else {
                item.onUploaded((contentSummary: ContentSummary) => {
                    this.contentSummary = contentSummary;
                });
            }
            return this;
        }

        getContentId(): ContentId {
            return this.contentSummary ? this.contentSummary.getContentId() : null;
        }

        getId(): string {
            return (this.contentSummary && this.contentSummary.getId()) ||
                   (this.uploadItem && this.uploadItem.getId()) ||
                   '';
        }

        getPath(): ContentPath {
            return this.contentSummary ? this.contentSummary.getPath() : null;
        }

        getType(): api.schema.content.ContentTypeName {
            return this.contentSummary ? this.contentSummary.getType() : null;
        }

        getDisplayName(): string {
            return this.contentSummary ? this.contentSummary.getDisplayName() : null;
        }

        getIconUrl(): string {
            return this.contentSummary ? this.contentSummary.getIconUrl() : null;
        }

        hasChildren(): boolean {
            return !!this.contentSummary ? this.contentSummary.hasChildren() : false;
        }

        getStatusText(): string {
            let value = CompareStatusFormatter.formatStatusTextFromContent(this);

            if (PublishStatus.EXPIRED === this.getPublishStatus() || PublishStatus.PENDING === this.getPublishStatus()) {
                value += ' (' + PublishStatusFormatter.formatStatus(this.getPublishStatus()) + ')';
            }

            return value;
        }

        getStatusClass(): string {
            let value = CompareStatusFormatter.formatStatusClassFromContent(this).toLowerCase();

            if (PublishStatus.EXPIRED === this.getPublishStatus() || PublishStatus.PENDING === this.getPublishStatus()) {
                value += ' ' + PublishStatusFormatter.formatStatus(this.getPublishStatus()).toLowerCase();
            }

            return api.content.util.ContentRowFormatter.makeClassName(value);
        }

        equals(o: api.Equitable): boolean {

            if (!api.ObjectHelper.iFrameSafeInstanceOf(o, ContentSummaryAndCompareStatus)) {
                return false;
            }

            let other = <ContentSummaryAndCompareStatus>o;

            if (!api.ObjectHelper.equals(this.uploadItem, other.uploadItem)) {
                return false;
            }

            if (!api.ObjectHelper.equals(this.contentSummary, other.contentSummary)) {
                return false;
            }

            if (this.compareStatus !== other.compareStatus) {
                return false;
            }

            return true;
        }

        setReadOnly(value: boolean) {
            this.readOnly = value;
        }

        isReadOnly(): boolean {
            return this.readOnly;
        }

        isPendingDelete(): boolean {
            return api.content.CompareStatusChecker.isPendingDelete(this.getCompareStatus());
        }

        isPublished(): boolean {
            return api.content.CompareStatusChecker.isPublished(this.getCompareStatus());
        }

        isOnline(): boolean {
            return api.content.CompareStatusChecker.isOnline(this.getCompareStatus());
        }

        isNew(): boolean {
            return api.content.CompareStatusChecker.isNew(this.getCompareStatus());
        }
    }
}
