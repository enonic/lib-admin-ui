module api.schema.xdata {

    import MixinListJson = api.schema.mixin.MixinListJson;
    import Mixin = api.schema.mixin.Mixin;
    import MixinJson = api.schema.mixin.MixinJson;

    export class GetContentXDataRequest
        extends XDataResourceRequest<MixinListJson, Mixin[]> {

        private contentId: ContentId;

        constructor(contentId: ContentId) {
            super();
            super.setMethod('GET');
            this.contentId = contentId;
        }

        getParams(): Object {
            return {
                contentId: this.contentId.toString()
            };
        }

        getRequestPath(): api.rest.Path {
            return api.rest.Path.fromParent(super.getResourcePath(), 'getContentXData');
        }

        sendAndParse(): wemQ.Promise<Mixin[]> {

            return this.send().then((response: api.rest.JsonResponse<MixinListJson>) => {
                return response.getResult().mixins.map((mixinJson: MixinJson) => {
                    return this.fromJsonToMixin(mixinJson);
                });
            });
        }
    }
}
