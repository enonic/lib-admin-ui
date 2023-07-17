import {Path} from '../rest/Path';
import {ElementHelper} from '../dom/ElementHelper';

export enum ApplicationShowStatus {
    NOT_DISPLAYED,
    PREPARING,
    DISPLAYED
}

export class Application {
    private id: string;
    private name: string;
    private shortName: string;
    private iconUrl: string;
    private iconTooltip: string;
    private openTabs: number;
    private status: ApplicationShowStatus;
    private loaded: boolean;
    private path: Path;
    private loadedListeners: (() => void)[] = [];
    private window: Window;

    constructor(id: string, name: string, shortName: string, icon?: string, iconTooltip?: string) {
        this.id = id;
        this.name = name;
        this.shortName = shortName;
        this.iconUrl = icon;
        this.iconTooltip = iconTooltip;
        this.openTabs = 0;
        this.status = ApplicationShowStatus.NOT_DISPLAYED;
    }

    static getApplication(): Application {
        return window.parent['getApplication'] ? window.parent['getApplication'](Application.getAppId()) : null;
    }

    static getAppId(): string {
        return window.frameElement ? new ElementHelper(window.frameElement as HTMLElement).getAttribute('data-wem-app-id') : null;
    }

    isLoaded(): boolean {
        return this.loaded;
    }

    getId(): string {
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    getShortName(): string {
        return this.shortName;
    }

    getIconUrl(): string {
        return this.iconUrl;
    }

    getIconTooltip(): string {
        return this.iconTooltip;
    }

    getOpenTabs(): number {
        return this.openTabs;
    }

    getWindow(): Window {
        return this.window;
    }

    setWindow(window: Window) {
        this.window = window;
    }

    hide() {
        this.status = ApplicationShowStatus.NOT_DISPLAYED;
    }

    show() {
        this.status = ApplicationShowStatus.DISPLAYED;
    }

    setOpenTabs(value: number): Application {
        this.openTabs = value;
        return this;
    }

    setLoaded(value: boolean): Application {
        this.loaded = value;
        this.notifyLoaded();
        return this;
    }

    setDisplayingStatus(status: ApplicationShowStatus) {
        this.status = status;
    }

    setPath(path: Path): Application {
        this.path = path;
        return this;
    }

    getPath(): Path {
        return this.path;
    }

    isDisplayed(): boolean {
        return ApplicationShowStatus.DISPLAYED === this.status;
    }

    isPreparing(): boolean {
        return this.status === ApplicationShowStatus.PREPARING;
    }

    isNotDisplayed(): boolean {
        return this.status === ApplicationShowStatus.NOT_DISPLAYED;
    }

    onLoaded(listener: () => void) {
        this.loadedListeners.push(listener);
    }

    unLoaded(listener: () => void) {
        this.loadedListeners = this.loadedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyLoaded() {
        this.loadedListeners.forEach((listener) => {
            listener();
        });
    }
}
