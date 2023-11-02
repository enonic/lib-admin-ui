import {EventJson} from '../event/EventJson';
import {Event} from '../event/Event';
import {ApplicationKey} from './ApplicationKey';
import {ClassHelper} from '../ClassHelper';

export enum ApplicationEventType {
    INSTALLED, UNINSTALLED, RESOLVED, STARTING, STARTED, UPDATED, STOPPING, STOPPED, UNRESOLVED, PROGRESS
}

export interface ApplicationEventJson
    extends EventJson {
    data: ApplicationEventDataJson;
}

export interface ApplicationEventDataJson {
    eventType: string;
    applicationKey?: string; // ApplicationEvent.fromJson indicates it can be undefined
    applicationUrl?: string;
    systemApplication: boolean;
    progress?: number;
}

export class ApplicationEvent
    extends Event {

    private applicationKey: ApplicationKey | null;

    private applicationUrl: string;

    private systemApplication: boolean;

    private eventType: ApplicationEventType;

    private progress: number;

    constructor(applicationKey: ApplicationKey | null,
                eventType: ApplicationEventType,
                systemApplication: boolean,
                applicationUrl?: string,
                progress?: number) {
        super();
        this.applicationKey = applicationKey;
        this.applicationUrl = applicationUrl;
        this.systemApplication = systemApplication;
        this.eventType = eventType;
        this.progress = progress;
    }

    static on(handler: (event: ApplicationEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ApplicationEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

    static fromJson(applicationEventJson: ApplicationEventJson): ApplicationEvent {
        const applicationKey = !!applicationEventJson.data.applicationKey ? ApplicationKey.fromString(
            applicationEventJson.data.applicationKey) : null;
        const eventType = ApplicationEventType[applicationEventJson.data.eventType];
        const systemApplication = applicationEventJson.data.systemApplication;
        const applicationUrl = applicationEventJson.data.applicationUrl;
        const progress = applicationEventJson.data.progress;
        return new ApplicationEvent(applicationKey, eventType, systemApplication, applicationUrl, progress);
    }

    // Since fromJson
    public getApplicationKey(): ApplicationKey | null {
        return this.applicationKey;
    }

    public getEventType(): ApplicationEventType {
        return this.eventType;
    }

    public getApplicationUrl(): string {
        return this.applicationUrl;
    }

    public getProgress(): number {
        return this.progress;
    }

    public isSystemApplication(): boolean {
        return this.systemApplication;
    }

    isNeedToUpdateApplication(): boolean {
        return ApplicationEventType.RESOLVED !== this.eventType &&
               ApplicationEventType.STARTING !== this.eventType &&
               ApplicationEventType.UNRESOLVED !== this.eventType &&
               ApplicationEventType.STOPPING !== this.eventType;
    }
}
