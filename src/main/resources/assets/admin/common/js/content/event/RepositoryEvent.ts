module api.content.event {

    export enum RepositoryEventType {
        RESTORED, RESTORE_INITIALIZED, CREATED, UPDATED, DELETED
    }

    export interface RepositoryEventJson
        extends api.event.EventJson {

        data?: RepositoryEventDataJson;
    }

    export interface RepositoryEventDataJson {}

    export class RepositoryEvent
        extends api.event.Event {

        private type: RepositoryEventType;

        constructor(type: RepositoryEventType) {
            super();
            this.type = type;
        }

        getType(): RepositoryEventType {
            return this.type;
        }

        isRestored(): boolean {
            return this.type === RepositoryEventType.RESTORED;
        }

        static on(handler: (event: RepositoryEvent) => void) {
            api.event.Event.bind(api.ClassHelper.getFullName(this), handler);
        }

        static un(handler?: (event: RepositoryEvent) => void) {
            api.event.Event.unbind(api.ClassHelper.getFullName(this), handler);
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
    }

}
