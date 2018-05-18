module api.content.resource {

    import TaskIdJson = api.task.TaskIdJson;
    import TaskId = api.task.TaskId;

    export type DuplicatableId = {
        id: ContentId,
        withChildren: boolean
    }

    export class DuplicateContentRequest
        extends ContentResourceRequest<TaskIdJson, TaskId> {

        private ids: DuplicatableId[];

        constructor(ids: DuplicatableId[]) {
            super();
            this.setHeavyOperation(true);
            super.setMethod('POST');
            this.ids = ids;
        }

        getParams(): Object {
            return {
                duplicatableIds: this.ids
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
