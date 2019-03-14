module api.content.form.inputtype.upload {

    import Content = api.content.Content;
    import ContentJson = api.content.json.ContentJson;
    import ContentResourceRequest = api.content.resource.ContentResourceRequest;

    export class DeleteAttachmentRequest
        extends ContentResourceRequest<ContentJson, Content> {

        private contentId: ContentId;

        private attachmentNames: string[] = [];

        constructor() {
            super();
            super.setMethod('POST');
        }

        setContentId(contentId: ContentId): DeleteAttachmentRequest {
            this.contentId = contentId;
            return this;
        }

        addAttachmentName(value: string): DeleteAttachmentRequest {
            this.attachmentNames.push(value);
            return this;
        }

        getParams(): Object {
            return {
                contentId: this.contentId.toString(),
                attachmentNames: this.attachmentNames
            };
        }

        getRequestPath(): api.rest.Path {
            return api.rest.Path.fromParent(super.getResourcePath(), 'deleteAttachment');
        }

        sendAndParse(): wemQ.Promise<Content> {
            return this.send().then((response: api.rest.JsonResponse<ContentJson>) => {
                return this.fromJsonToContent(response.getResult());
            });
        }
    }
}
