import {EventJson} from '../../event/EventJson';
import {Event} from '../../event/Event';
import {ClassHelper} from '../../ClassHelper';

export enum RepositoryEventType {
    RESTORED, RESTORE_INITIALIZED, CREATED, UPDATED, DELETED
}

export interface RepositoryEventJson
    extends EventJson {

    data?: RepositoryEventDataJson;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RepositoryEventDataJson {}

export class RepositoryEvent
    extends Event {

    private type: RepositoryEventType;

    constructor(type: RepositoryEventType) {
        super();
        this.type = type;
    }

    static on(handler: (event: RepositoryEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: RepositoryEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

    static fromJson(repositoryEventJson: RepositoryEventJson): RepositoryEvent {
        let type: RepositoryEventType;
        switch (repositoryEventJson.type.slice(11)) {
        case 'restored':
            type = RepositoryEventType.RESTORED;
            break;
        case 'restoreInitialized':
            type = RepositoryEventType.RESTORE_INITIALIZED;
            break;
        case 'created':
            type = RepositoryEventType.CREATED;
            break;
        case 'updated':
            type = RepositoryEventType.UPDATED;
            break;
        case 'deleted':
            type = RepositoryEventType.DELETED;
            break;
        }
        return new RepositoryEvent(type);
    }

    getType(): RepositoryEventType {
        return this.type;
    }

    isRestored(): boolean {
        return this.type === RepositoryEventType.RESTORED;
    }
}
