module api.content {

    import Thumbnail = api.thumb.Thumbnail;
    import ContentState = api.schema.content.ContentState;
    import WorkflowState = api.content.WorkflowState;
    import Workflow = api.content.Workflow;

    export class ContentSummary {

        private id: string;

        private contentId: ContentId;

        private name: ContentName;

        private displayName: string;

        private path: ContentPath;

        private root: boolean;

        private children: boolean;

        private type: api.schema.content.ContentTypeName;

        private iconUrl: string;

        private thumbnail: Thumbnail;

        private modifier: string;

        private owner: api.security.PrincipalKey;

        private page: boolean;

        private valid: boolean;

        private requireValid: boolean;

        private createdTime: Date;

        private modifiedTime: Date;

        private publishFirstTime: Date;

        private publishFromTime: Date;

        private publishToTime: Date;

        private deletable: boolean;

        private editable: boolean;

        private childOrder: api.content.order.ChildOrder;

        private language: string;

        private contentState: ContentState;

        private workflow: Workflow;

        constructor(builder: ContentSummaryBuilder) {
            this.name = builder.name;
            this.displayName = builder.displayName;
            this.path = builder.path;
            this.root = builder.root;
            this.children = builder.children;
            this.type = builder.type;
            this.iconUrl = builder.iconUrl;
            this.thumbnail = builder.thumbnail;
            this.modifier = builder.modifier;
            this.owner = builder.owner;
            this.page = builder.page;
            this.valid = builder.valid;
            this.requireValid = builder.requireValid;

            this.id = builder.id;
            this.contentId = builder.contentId;
            this.createdTime = builder.createdTime;
            this.modifiedTime = builder.modifiedTime;
            this.publishFromTime = builder.publishFromTime;
            this.publishToTime = builder.publishToTime;
            this.publishFirstTime = builder.publishFirstTime;
            this.deletable = builder.deletable;
            this.editable = builder.editable;
            this.childOrder = builder.childOrder;
            this.language = builder.language;
            this.contentState = builder.contentState;
            this.workflow = builder.workflow;
        }

        getName(): ContentName {
            return this.name;
        }

        getDisplayName(): string {
            return this.displayName;
        }

        hasParent(): boolean {
            return this.path.hasParentContent();
        }

        getPath(): ContentPath {
            return this.path;
        }

        isRoot(): boolean {
            return this.root;
        }

        hasChildren(): boolean {
            return this.children;
        }

        getType(): api.schema.content.ContentTypeName {
            return this.type;
        }

        getIconUrl(): string {
            return this.iconUrl;
        }

        hasThumbnail(): boolean {
            return !!this.thumbnail;
        }

        getThumbnail(): Thumbnail {
            return this.thumbnail;
        }

        getOwner(): api.security.PrincipalKey {
            return this.owner;
        }

        getModifier(): string {
            return this.modifier;
        }

        isSite(): boolean {
            return this.type.isSite();
        }

        isPage(): boolean {
            return this.page;
        }

        isPageTemplate(): boolean {
            return this.type.isPageTemplate();
        }

        isImage(): boolean {
            return this.type.isImage();
        }

        isValid(): boolean {
            return this.valid;
        }

        isRequireValid(): boolean {
            return this.requireValid;
        }

        getId(): string {
            return this.id;
        }

        getContentId(): ContentId {
            return this.contentId;
        }

        getCreatedTime(): Date {
            return this.createdTime;
        }

        getModifiedTime(): Date {
            return this.modifiedTime;
        }

        getPublishFirstTime(): Date {
            return this.publishFirstTime;
        }

        getPublishFromTime(): Date {
            return this.publishFromTime;
        }

        getPublishToTime(): Date {
            return this.publishToTime;
        }

        isDeletable(): boolean {
            return this.deletable;
        }

        isEditable(): boolean {
            return this.editable;
        }

        getChildOrder(): api.content.order.ChildOrder {
            return this.childOrder;
        }

        getLanguage(): string {
            return this.language;
        }

        getContentState(): ContentState {
            return this.contentState;
        }

        getWorkflow(): Workflow {
            return this.workflow;
        }

        isReady(): boolean {
            return !!this.workflow && this.workflow.getState() === WorkflowState.READY;
        }

        isInProgress(): boolean {
            return !!this.workflow && this.workflow.getState() === WorkflowState.IN_PROGRESS;
        }

        equals(o: api.Equitable): boolean {

            if (!api.ObjectHelper.iFrameSafeInstanceOf(o, ContentSummary)) {
                return false;
            }

            let other = <ContentSummary>o;

            if (!api.ObjectHelper.stringEquals(this.id, other.getId())) {
                return false;
            }
            if (!api.ObjectHelper.equals(this.contentId, other.contentId)) {
                return false;
            }
            if (!api.ObjectHelper.equals(this.name, other.getName())) {
                return false;
            }
            if (!api.ObjectHelper.stringEquals(this.displayName, other.getDisplayName())) {
                return false;
            }
            if (!api.ObjectHelper.equals(this.path, other.getPath())) {
                return false;
            }
            if (!api.ObjectHelper.booleanEquals(this.root, other.isRoot())) {
                return false;
            }
            if (!api.ObjectHelper.booleanEquals(this.children, other.hasChildren())) {
                return false;
            }
            if (!api.ObjectHelper.equals(this.type, other.getType())) {
                return false;
            }
            if (!api.ObjectHelper.stringEquals(this.iconUrl, other.getIconUrl())) {
                return false;
            }
            if (!api.ObjectHelper.equals(this.thumbnail, other.getThumbnail())) {
                return false;
            }
            if (!api.ObjectHelper.stringEquals(this.modifier, other.getModifier())) {
                return false;
            }
            if (!api.ObjectHelper.objectEquals(this.owner, other.getOwner())) {
                return false;
            }
            if (!api.ObjectHelper.booleanEquals(this.page, other.isPage())) {
                return false;
            }
            if (!api.ObjectHelper.booleanEquals(this.valid, other.isValid())) {
                return false;
            }
            if (!api.ObjectHelper.booleanEquals(this.requireValid, other.isRequireValid())) {
                return false;
            }
            if (!api.ObjectHelper.dateEquals(this.createdTime, other.getCreatedTime())) {
                return false;
            }
            if (!api.ObjectHelper.dateEquals(this.modifiedTime, other.getModifiedTime())) {
                return false;
            }
            if (!api.ObjectHelper.dateEquals(this.publishFromTime, other.getPublishFromTime())) {
                return false;
            }
            if (!api.ObjectHelper.dateEquals(this.publishToTime, other.getPublishToTime())) {
                return false;
            }
            if (!api.ObjectHelper.dateEquals(this.publishFirstTime, other.getPublishFirstTime())) {
                return false;
            }
            if (!api.ObjectHelper.booleanEquals(this.deletable, other.isDeletable())) {
                return false;
            }
            if (!api.ObjectHelper.booleanEquals(this.editable, other.isEditable())) {
                return false;
            }
            if (!api.ObjectHelper.stringEquals(this.language, other.getLanguage())) {
                return false;
            }
            if (!api.ObjectHelper.objectEquals(this.contentState, other.getContentState())) {
                return false;
            }
            if (!api.ObjectHelper.equals(this.workflow, other.getWorkflow())) {
                return false;
            }
            return true;
        }

        static fromJson(json: api.content.json.ContentSummaryJson): ContentSummary {
            return new ContentSummaryBuilder().fromContentSummaryJson(json).build();
        }

        static fromJsonArray(jsonArray: api.content.json.ContentSummaryJson[]): ContentSummary[] {
            let array: ContentSummary[] = [];
            jsonArray.forEach((json: api.content.json.ContentSummaryJson) => {
                array.push(ContentSummary.fromJson(json));
            });
            return array;
        }
    }

    export class ContentSummaryBuilder {

        id: string;

        contentId: ContentId;

        name: ContentName;

        displayName: string;

        path: ContentPath;

        root: boolean;

        children: boolean;

        type: api.schema.content.ContentTypeName;

        iconUrl: string;

        thumbnail: Thumbnail;

        modifier: string;

        owner: api.security.PrincipalKey;

        page: boolean;

        valid: boolean;

        requireValid: boolean;

        createdTime: Date;

        modifiedTime: Date;

        publishFirstTime: Date;

        publishFromTime: Date;

        publishToTime: Date;

        deletable: boolean;

        editable: boolean;

        childOrder: api.content.order.ChildOrder;

        language: string;

        contentState: ContentState;

        workflow: Workflow;

        constructor(source?: ContentSummary) {
            if (source) {
                this.id = source.getId();
                this.contentId = source.getContentId();
                this.name = source.getName();
                this.displayName = source.getDisplayName();
                this.path = source.getPath();
                this.root = source.isRoot();
                this.children = source.hasChildren();
                this.type = source.getType();
                this.iconUrl = source.getIconUrl();
                this.thumbnail = source.getThumbnail();
                this.modifier = source.getModifier();
                this.owner = source.getOwner();
                this.page = source.isPage();
                this.valid = source.isValid();
                this.requireValid = source.isRequireValid();
                this.createdTime = source.getCreatedTime();
                this.modifiedTime = source.getModifiedTime();
                this.publishFromTime = source.getPublishFromTime();
                this.publishToTime = source.getPublishToTime();
                this.publishFirstTime = source.getPublishFirstTime();
                this.deletable = source.isDeletable();
                this.editable = source.isEditable();
                this.childOrder = source.getChildOrder();
                this.language = source.getLanguage();
                this.contentState = source.getContentState();
                this.workflow = source.getWorkflow();
            }
        }

        fromContentSummaryJson(json: api.content.json.ContentSummaryJson): ContentSummaryBuilder {
            this.name = ContentName.fromString(json.name);
            this.displayName = json.displayName;
            this.path = ContentPath.fromString(json.path);
            this.root = json.isRoot;
            this.children = json.hasChildren;
            this.type = new api.schema.content.ContentTypeName(json.type);
            this.iconUrl = json.iconUrl;
            this.thumbnail = json.thumbnail ? Thumbnail.create().fromJson(json.thumbnail).build() : null;
            this.modifier = json.modifier;
            this.owner = json.owner ? api.security.PrincipalKey.fromString(json.owner) : null;
            this.page = json.isPage;
            this.valid = json.isValid;
            this.requireValid = json.requireValid;
            this.language = json.language;

            this.id = json.id;
            this.contentId = new ContentId(json.id);
            this.createdTime = json.createdTime ? new Date(Date.parse(json.createdTime)) : null;
            this.modifiedTime = json.modifiedTime ? new Date(Date.parse(json.modifiedTime)) : null;
            this.publishFirstTime = json.publish && json.publish.first ? new Date(Date.parse(json.publish.first)) : null;
            this.publishFromTime = json.publish && json.publish.from ? new Date(Date.parse(json.publish.from)) : null;
            this.publishToTime = json.publish && json.publish.to ? new Date(Date.parse(json.publish.to)) : null;

            this.deletable = json.deletable;
            this.editable = json.editable;

            this.childOrder = api.content.order.ChildOrder.fromJson(json.childOrder);

            this.contentState = ContentState.fromString(json.contentState);
            this.workflow = Workflow.fromJson(json.workflow);

            return this;
        }

        setId(value: string): ContentSummaryBuilder {
            this.id = value;
            return this;
        }

        setContentId(value: ContentId): ContentSummaryBuilder {
            this.contentId = value;
            return this;
        }

        setIconUrl(value: string): ContentSummaryBuilder {
            this.iconUrl = value;
            return this;
        }

        setContentState(value: ContentState): ContentSummaryBuilder {
            this.contentState = value;
            return this;
        }

        setValid(value: boolean): ContentSummaryBuilder {
            this.valid = value;
            return this;
        }

        setRequireValid(value: boolean): ContentSummaryBuilder {
            this.valid = value;
            return this;
        }

        setName(value: ContentName): ContentSummaryBuilder {
            this.name = value;
            return this;
        }

        setPath(path: ContentPath): ContentSummaryBuilder {
            this.path = path;
            return this;
        }

        setType(value: api.schema.content.ContentTypeName): ContentSummaryBuilder {
            this.type = value;
            return this;
        }

        setDisplayName(value: string): ContentSummaryBuilder {
            this.displayName = value;
            return this;
        }

        setHasChildren(value: boolean): ContentSummaryBuilder {
            this.children = value;
            return this;
        }

        setDeletable(value: boolean): ContentSummaryBuilder {
            this.deletable = value;
            return this;
        }

        setPublishFromTime(value: Date): ContentSummaryBuilder {
            this.publishFromTime = value;
            return this;
        }

        setPublishToTime(value: Date): ContentSummaryBuilder {
            this.publishToTime = value;
            return this;
        }

        setPublishFirstTime(value: Date): ContentSummaryBuilder {
            this.publishFirstTime = value;
            return this;
        }

        setWorkflow(value: Workflow): ContentSummaryBuilder {
            this.workflow = value;
            return this;
        }

        build(): ContentSummary {
            return new ContentSummary(this);
        }
    }
}
