import {EventJson} from '../event/EventJson';
import {Event} from '../event/Event';
import {ClassHelper} from '../ClassHelper';
import {TaskInfo} from './TaskInfo';
import {TaskInfoJson} from './TaskInfoJson';

export enum TaskEventType {
    SUBMITTED, UPDATED, REMOVED, FINISHED, FAILED
}

export interface TaskEventJson
    extends EventJson {
    data: TaskEventDataJson;
}

export interface TaskEventDataJson
    extends TaskInfoJson {
    application: string;
    user: string;
}

export class TaskEvent
    extends Event {

    private eventType: TaskEventType;

    private taskInfo: TaskInfo;

    constructor(taskInfo: TaskInfo, type: TaskEventType) {
        super();
        this.taskInfo = taskInfo;
        this.eventType = type;
    }

    static on(handler: (event: TaskEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: TaskEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
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

        const taskInfo: TaskInfo = TaskInfo.fromJson(eventJson.data);

        return new TaskEvent(taskInfo, type);
    }

    getEventType(): TaskEventType {
        return this.eventType;
    }

    getTaskInfo(): TaskInfo {
        return this.taskInfo;
    }
}
