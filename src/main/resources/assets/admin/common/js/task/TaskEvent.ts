module api.task {

    export enum TaskEventType {
        SUBMITTED, UPDATED, REMOVED, FINISHED, FAILED
    }

    export interface TaskEventJson
        extends api.event.EventJson {
        data: TaskEventDataJson;
    }

    export interface TaskEventDataJson
        extends TaskInfoJson {
        application: string;
        user: string;
    }

    export class TaskEvent
        extends api.event.Event {

        private eventType: TaskEventType;

        private taskInfo: TaskInfo;

        constructor(taskInfo: TaskInfo, type: TaskEventType) {
            super();
            this.taskInfo = taskInfo;
            this.eventType = type;
        }

        getEventType(): TaskEventType {
            return this.eventType;
        }

        getTaskInfo(): TaskInfo {
            return this.taskInfo;
        }

        static on(handler: (event: TaskEvent) => void) {
            api.event.Event.bind(api.ClassHelper.getFullName(this), handler);
        }

        static un(handler?: (event: TaskEvent) => void) {
            api.event.Event.unbind(api.ClassHelper.getFullName(this), handler);
        }

        static fromJson(eventJson: TaskEventJson): TaskEvent {
            let type: TaskEventType;
            switch (eventJson.type.slice(5)) {
            case 'updated':
                type = TaskEventType.UPDATED;
                break;
            case 'submitted':
                type = TaskEventType.SUBMITTED;
                break;
            case 'removed':
                type = TaskEventType.REMOVED;
                break;
            case 'finished':
                type = TaskEventType.FINISHED;
                break;
            case 'failed':
                type = TaskEventType.FAILED;
                break;
            }

            const taskInfo: TaskInfo = api.task.TaskInfo.fromJson(eventJson.data);

            return new TaskEvent(taskInfo, type);
        }
    }
}
