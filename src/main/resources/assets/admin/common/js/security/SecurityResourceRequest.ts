module api.security {

    export class SecurityResourceRequest<JSON_TYPE, PARSED_TYPE> extends api.rest.ResourceRequest<JSON_TYPE, PARSED_TYPE> {

        private resourcePath: api.rest.Path;

        constructor() {
            super();
            this.resourcePath = api.rest.Path.fromParent(super.getRestPath(), 'security');
        }

        getResourcePath(): api.rest.Path {
            return this.resourcePath;
        }
    }
}
