module api.content.resource {

    import TaskIdJson = api.task.TaskIdJson;
    import TaskId = api.task.TaskId;

    export class DuplicateContentRequest
        extends ContentResourceRequest<TaskIdJson, TaskId> {

        private ids: ContentIds;

        constructor(ids: ContentIds) {
            super();
            this.setHeavyOperation(true);
            super.setMethod('POST');
            this.ids = ids;
        }

        getParams(): Object {
            return {
                contentIds: this.ids.map(id => id.toString())
            };
        }

        getRequestPath(): api.rest.Path {
            return api.rest.Path.fromParent(super.getResourcePath(), 'duplicate');
        }

        sendAndParse(): wemQ.Promise<TaskId> {
            return this.send().then((response: api.rest.JsonResponse<TaskIdJson>) => {
                return TaskId.fromJson(response.getResult());
            });
        }
    }
}
