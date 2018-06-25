module api.content.resource {

    import ContentsExistByPathJson = api.content.json.ContentsExistByPathJson;
    import ContentsExistByPathResult = api.content.resource.result.ContentsExistByPathResult;

    export class ContentsExistByPathRequest
        extends ContentResourceRequest<ContentsExistByPathJson, ContentsExistByPathResult> {

        private contentPaths: string[] = [];

        constructor(contentPaths: string[]) {
            super();
            super.setMethod('POST');
            this.contentPaths = contentPaths;
        }

        getParams(): Object {
            return {
                contentPaths: this.contentPaths
            };
        }

        getRequestPath(): api.rest.Path {
            return api.rest.Path.fromParent(super.getResourcePath(), 'contentsExistByPath');
        }

        sendAndParse(): wemQ.Promise<ContentsExistByPathResult> {

            return this.send().then((response: api.rest.JsonResponse<ContentsExistByPathJson>) => {
                return new ContentsExistByPathResult(response.getResult());
            });
        }
    }
}
