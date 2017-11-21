module api.content.resource {

    import ContentDependencyJson = api.content.json.ContentDependencyJson;
    import ContentId = api.content.ContentId;

    export interface ResolveDependencyResultJson {

        contentId: string;

        dependency: ContentDependencyJson;

    }
    export class ResolveDependencyResult {

       private contentId: ContentId;

       private dependency: ContentDependencyJson;

        constructor(contentId: ContentId, dependency: ContentDependencyJson) {

            this.contentId = contentId;
            this.dependency = dependency;
        }

        getDependency():ContentDependencyJson {
            return this.dependency;
        }

        getContentId(): ContentId {
            return this.contentId;
        }
    }
}
