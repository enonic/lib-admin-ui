module api.content.resource {

    export class ResolveDependenciesRequest
        extends ContentResourceRequest<ResolveDependenciesResultJson, ResolveDependenciesResult> {

        private ids: ContentId[];

        constructor(contentIds: ContentId[]) {
            super();
            super.setMethod('POST');
            this.ids = contentIds;
        }

        getParams(): Object {
            return {
                contentIds: this.ids.map(id => id.toString())
            };
        }

        getRequestPath(): api.rest.Path {
            return api.rest.Path.fromParent(super.getResourcePath(), 'getDependencies');
        }

        sendAndParse(): wemQ.Promise<ResolveDependenciesResult> {

            return this.send().then((response: api.rest.JsonResponse<any>) => {
                return ResolveDependenciesResult.fromJson(response.getResult());
            });
        }
    }
}
