import {Event} from './Event';
import {ClassHelper} from '../ClassHelper';
import {EventJson} from './EventJson';
import {NodeServerChange} from './NodeServerChange';

export interface NodeEventJson
    extends EventJson {
    data: NodeEventDataJson;
}

export interface NodeEventDataJson {
    nodes: NodeEventNodeJson[];
}

export interface NodeEventNodeJson {
    id: string;
    path: string;
    newPath: string;
    branch: string;
}

export class NodeServerEvent
    extends Event {

    private change: NodeServerChange<any>;

    constructor(change: NodeServerChange<any>) {
        super();
        this.change = change;
    }

    static is(_eventJson: NodeEventJson): boolean {
        throw new Error('must be implemented in inheritors');
    }

    static on(handler: (event: NodeServerEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: NodeServerEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

    static fromJson(_nodeEventJson: NodeEventJson): NodeServerEvent {
        throw new Error('must be implemented in inheritors');
    }

    getNodeChange(): NodeServerChange<any> {
        return this.change;
    }

    toString(): string {
        return 'NodeServerEvent: [' + this.change.toString() + ']';
    }
}
