import {ApplicationKey} from './ApplicationKey';
import {MarketApplicationJson} from './json/MarketApplicationJson';
import {i18n} from '../util/Messages';
import {ProgressBar} from '../ui/ProgressBar';
import {SpanEl} from '../dom/SpanEl';
import {IDentifiable} from '../IDentifiable';

export class MarketApplication implements IDentifiable {

    private appKey: ApplicationKey;
    private displayName: string;
    private name: string;
    private description: string;
    private iconUrl: string;
    private url: string;
    private latestVersion: string;
    private versions: Object;
    private status: MarketAppStatus = MarketAppStatus.NOT_INSTALLED;
    private progress: number = 0;

    constructor(builder: MarketApplicationBuilder) {
        this.displayName = builder.displayName;
        this.name = builder.name;
        this.description = builder.description;
        this.iconUrl = builder.iconUrl;
        this.url = builder.url;
        this.latestVersion = builder.latestVersion;
        this.versions = builder.versions;
        this.appKey = builder.appKey;
    }

    static fromJson(appKey: string, json: MarketApplicationJson): MarketApplication {
        return new MarketApplicationBuilder().fromJson(appKey, json).build();
    }

    static fromJsonArray(appsObj: Object): MarketApplication[] {
        const array: MarketApplication[] = [];
        for (const name in appsObj) {
            if (appsObj.hasOwnProperty(name)) {
                array.push(MarketApplication.fromJson(name, appsObj[name] as MarketApplicationJson));
            }
        }
        return array;
    }

    public getId(): string {
        return this.appKey ? this.appKey.toString() : '';
    }

    public isEmpty(): boolean {
        return !this.displayName && !this.url;
    }

    public isToUpdate(): boolean {
        return this.status === MarketAppStatus.OLDER_VERSION_INSTALLED;
    }

    public getDisplayName(): string {
        return this.displayName;
    }

    public getName(): string {
        return this.name;
    }

    public getDescription(): string {
        return this.description;
    }

    public getIconUrl(): string {
        return this.iconUrl;
    }

    public getUrl(): string {
        return this.url;
    }

    public getLatestVersion(): string {
        return this.latestVersion;
    }

    public getLatestVersionDownloadUrl(): string {
        if (this.getLatestVersion()) {
            return this.getVersions()[this.getLatestVersion()]['applicationUrl'];
        } else {
            return null;
        }
    }

    public getVersions(): Object {
        return this.versions;
    }

    public setStatus(status: MarketAppStatus) {
        this.status = status;
    }

    public getStatus(): MarketAppStatus {
        return this.status;
    }

    public setProgress(progress: number) {
        this.progress = progress;
    }

    public getProgress(): number {
        return this.progress;
    }

    public getAppKey(): ApplicationKey {
        return this.appKey;
    }
}

export enum MarketAppStatus {
    NOT_INSTALLED,
    INSTALLED,
    INSTALLING,
    OLDER_VERSION_INSTALLED,
    UNKNOWN
}

export class MarketAppStatusFormatter {

    public static statusInstallCssClass: string = 'install';

    public static statusInstalledCssClass: string = 'installed';

    public static statusInstallingCssClass: string = 'installing';

    public static statusUpdateCssClass: string = 'update';

    public static formatStatus(appStatus: MarketAppStatus, progress: number = 0): string {
        switch (appStatus) {
        case MarketAppStatus.NOT_INSTALLED:
            return i18n('action.install');
        case MarketAppStatus.INSTALLED:
            return i18n('status.installed');
        case MarketAppStatus.INSTALLING:
            return String(progress);
        case MarketAppStatus.OLDER_VERSION_INSTALLED:
            return i18n('action.update');
        default:
            return i18n('status.unknown');
        }
    }

    public static createStatusElement(appStatus: MarketAppStatus, progress?: number) {
        if (appStatus === MarketAppStatus.INSTALLING) {
            return new ProgressBar(progress);
        }

        const status = MarketAppStatusFormatter.formatStatus(appStatus, progress);

        return new SpanEl().setHtml(status);
    }

    public static getStatusCssClass(appStatus: MarketAppStatus): string {
        switch (appStatus) {
        case MarketAppStatus.NOT_INSTALLED:
            return MarketAppStatusFormatter.statusInstallCssClass;
        case MarketAppStatus.INSTALLED:
            return MarketAppStatusFormatter.statusInstalledCssClass;
        case MarketAppStatus.INSTALLING:
            return MarketAppStatusFormatter.statusInstallingCssClass;
        case MarketAppStatus.OLDER_VERSION_INSTALLED:
            return MarketAppStatusFormatter.statusUpdateCssClass;
        default:
            return 'unknown';
        }
    }

    public static formatPerformedAction(appStatus: MarketAppStatus): string {
        switch (appStatus) {
        case MarketAppStatus.NOT_INSTALLED:
            return 'installed';
        case MarketAppStatus.OLDER_VERSION_INSTALLED:
            return 'updated';
        default:
            return 'installed';
        }
    }
}

export class MarketApplicationBuilder {

    displayName: string;
    name: string;
    description: string;
    iconUrl: string;
    url: string;
    latestVersion: string;
    versions: Object;
    status: string;
    appKey: ApplicationKey;

    public fromJson(appKey: string, json: MarketApplicationJson): MarketApplicationBuilder {
        this.appKey = ApplicationKey.fromString(appKey);
        this.displayName = json.displayName;
        this.description = json.description;
        this.iconUrl = json.iconUrl;
        this.url = json.url;
        this.latestVersion = json.latestVersion;
        this.versions = json.versions;
        this.name = json.name;
        return this;
    }

    setLatestVersion(latestVersion: string): MarketApplicationBuilder {
        this.latestVersion = latestVersion;
        return this;
    }

    public build(): MarketApplication {
        return new MarketApplication(this);
    }
}
