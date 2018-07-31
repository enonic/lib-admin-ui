module api.schema.xdata {

    import Mixin = api.schema.mixin.Mixin;

    export class XDataResourceRequest<JSON_TYPE, PARSED_TYPE>
        extends api.rest.ResourceRequest<JSON_TYPE, PARSED_TYPE> {
        private resourceUrl: api.rest.Path;

        constructor() {
            super();
            this.resourceUrl = api.rest.Path.fromParent(super.getRestPath(), 'schema/xdata');
        }

        getResourcePath(): api.rest.Path {
            return this.resourceUrl;
        }

        fromJsonToMixin(json: api.schema.mixin.MixinJson) {
            return Mixin.fromJson(json);
        }
    }
}
