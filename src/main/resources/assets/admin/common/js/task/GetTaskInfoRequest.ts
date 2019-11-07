import * as Q from 'q';
import {Path} from '../rest/Path';
import {JsonResponse} from '../rest/JsonResponse';
import {TaskResourceRequest} from './TaskResourceRequest';
import {TaskInfoJson} from './TaskInfoJson';
import {TaskInfo} from './TaskInfo';
import {TaskId} from './TaskId';

export class GetTaskInfoRequest
    extends TaskResourceRequest<TaskInfoJson, TaskInfo> {

    protected taskId: TaskId;

    constructor(taskId: TaskId) {
        super();
        this.taskId = taskId;
    }

    getParams(): Object {
        return {};
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), this.taskId.toString());
    }

    sendAndParse(): Q.Promise<TaskInfo> {
        return this.send().then((response: JsonResponse<TaskInfoJson>) => {
            return TaskInfo.fromJson(response.getResult());
        });
    }
}
