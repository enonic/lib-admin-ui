import {ResourceRequest} from './ResourceRequest';
import * as Q from 'q';
import {TaskIdJson} from '../task/TaskIdJson';
import {JsonResponse} from './JsonResponse';
import {TaskId} from '../task/TaskId';
import {TaskEvent, TaskEventType} from '../task/TaskEvent';
import {TaskInfo} from '../task/TaskInfo';
import {TaskState} from '../task/TaskState';
import {GetTaskInfoRequest} from '../task/GetTaskInfoRequest';
import {DefaultErrorHandler} from '../DefaultErrorHandler';

export class TaskWaitResourceRequest<PARSED_TYPE> extends ResourceRequest<PARSED_TYPE> {

    private taskHandler: (event: TaskEvent) => void;

    private taskDeferred: Q.Deferred<PARSED_TYPE>;

    sendAndParse(): Q.Promise<PARSED_TYPE> {
        return this.send().then((response: JsonResponse<TaskIdJson>) => {
            const taskId: TaskId = TaskId.fromJson(response.getResult());
            return this.waitForTaskToFinish(taskId);
        });
    }

    private waitForTaskToFinish(taskId: TaskId): Q.Promise<PARSED_TYPE> {
        this.taskDeferred = Q.defer<PARSED_TYPE>();

        let taskEventsComing: boolean = false; // no events coming might mean that task is finished before we've got here

        this.taskHandler = (event: TaskEvent) => {
            if (!event.getTaskInfo().getId().equals(taskId)) {
                return;
            }

            if (event.getEventType() === TaskEventType.REMOVED) {
                return;
            }

            taskEventsComing = true;

            this.handleTaskEvent(event.getTaskInfo());
        };

        TaskEvent.on(this.taskHandler);

        new GetTaskInfoRequest(taskId).sendAndParse().then((taskInfo: TaskInfo) => {
            if (!taskEventsComing) {
                this.handleTaskEvent(taskInfo);
            }
        }).catch(DefaultErrorHandler.handle);

        return this.taskDeferred.promise;
    }

    private handleTaskEvent(taskInfo: TaskInfo) {
        if (taskInfo.getState() === TaskState.FINISHED) {
            TaskEvent.un(this.taskHandler);
            this.taskDeferred.resolve(this.handleTaskFinished(taskInfo));
        } else if (taskInfo.getState() === TaskState.FAILED) {
            TaskEvent.un(this.taskHandler);
            this.taskDeferred.reject(this.handleTaskFailed(taskInfo));
        }
    }

    protected handleTaskFinished(taskInfo: TaskInfo): Q.Promise<PARSED_TYPE> {
        return Q(null);
    }

    protected handleTaskFailed(taskInfo: TaskInfo): any {
        return null;
    }
}
