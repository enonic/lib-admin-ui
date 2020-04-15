import {JsonResponse} from '../rest/JsonResponse';
import {TaskResourceRequest} from './TaskResourceRequest';
import {TaskInfoJson} from './TaskInfoJson';
import {TaskInfo} from './TaskInfo';
import {TaskId} from './TaskId';

export class GetTaskInfoRequest
    extends TaskResourceRequest<TaskInfo> {

    constructor(taskId: TaskId) {
        super();
        this.addRequestPathElements(taskId.toString());
    }

    protected parseResponse(response: JsonResponse<TaskInfoJson>): TaskInfo {
        return TaskInfo.fromJson(response.getResult());
    }
}
