import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';
import {TaskIdJson} from './TaskIdJson';

export class TaskId
    implements Equitable {

    private value: string;

    constructor(value: string) {
        this.value = value;
    }

    public static fromString(str: string): TaskId {
        return new TaskId(str);
    }

    static fromJson(json: TaskIdJson): TaskId {
        return TaskId.fromString(json.taskId);
    }

    public toString(): string {
        return this.value;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, TaskId)) {
            return false;
        }
        let other = o as TaskId;
        return this.value === other.value;
    }

}
