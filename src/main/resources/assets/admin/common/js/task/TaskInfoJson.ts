import {TaskProgressJson} from './TaskProgressJson';

export interface TaskInfoJson {
    id: string;
    description: string;
    state: string;
    progress: TaskProgressJson;
}
