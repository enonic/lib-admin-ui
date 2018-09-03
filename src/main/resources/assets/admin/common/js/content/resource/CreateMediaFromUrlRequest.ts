module api.content.resource {

    export class CreateMediaFromUrlRequest
        extends ContentResourceRequest<api.content.json.ContentJson, Content> {

        private url: string;

        private name: string;

        private parent: string;

        constructor() {
            super();
            super.setMethod('POST');
        }

        setUrl(url: string): CreateMediaFromUrlRequest {
            this.url = url;
            return this;
        }

        setName(name: string): CreateMediaFromUrlRequest {
            this.name = name;
            return this;
        }

        setParent(parent: string): CreateMediaFromUrlRequest {
            this.parent = parent;
            return this;
        }

        getParams(): Object {
            return {
                url: this.url,
                name: this.name,
                parent: this.parent ? this.parent : ''
            };
        }

        getRequestPath(): api.rest.Path {
            return api.rest.Path.fromParent(super.getResourcePath(), 'createMediaFromUrl');
        }

        sendAndParse(): wemQ.Promise<Content> {

            return this.send().then((response: api.rest.JsonResponse<api.content.json.ContentJson>) => {

                return this.fromJsonToContent(response.getResult());

            });
        }

    }
}
