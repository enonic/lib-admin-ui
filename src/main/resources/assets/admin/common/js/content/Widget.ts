import {ApplicationKey} from '../application/ApplicationKey';
import {WidgetDescriptorJson} from './json/WidgetDescriptorJson';
import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';

export class Widget {

    private readonly url: string;
    private readonly iconUrl: string;
    private readonly displayName: string;
    private readonly description: string;
    private readonly interfaces: string[];
    private readonly widgetDescriptorKey: WidgetDescriptorKey;
    private readonly context: string;
    protected readonly config: WidgetConfig;

    constructor(builder: WidgetBuilder) {
        this.url = builder.url;
        this.iconUrl = builder.iconUrl;
        this.displayName = builder.displayName;
        this.description = builder.description;
        this.interfaces = builder.interfaces;
        this.widgetDescriptorKey = builder.widgetDescriptorKey;
        this.config = builder.config;
        this.context = builder.context;
    }

    static create(): WidgetBuilder {
        return new WidgetBuilder();
    }

    static fromJson(json: WidgetDescriptorJson): Widget {
        return new WidgetBuilder().fromJson(json).build();
    }

    public getUrl(): string {
        return this.url;
    }

    public getIconUrl(): string {
        return this.iconUrl;
    }

    public getDisplayName(): string {
        return this.displayName;
    }

    public getDescription(): string {
        return this.description;
    }

    public getInterfaces(): string[] {
        return this.interfaces;
    }

    public getWidgetDescriptorKey(): WidgetDescriptorKey {
        return this.widgetDescriptorKey;
    }

    public getConfig(): WidgetConfig {
        return this.config;
    }

    getContext(): string {
        return this.context;
    }
}

export class WidgetBuilder {

    url: string;

    iconUrl: string;

    displayName: string;

    description: string;

    interfaces: string[];

    widgetDescriptorKey: WidgetDescriptorKey;

    context: string;

    config: WidgetConfig;

    constructor(source?: Widget) {
        if (source) {
            this.url = source.getUrl();
            this.iconUrl = source.getIconUrl();
            this.displayName = source.getDisplayName();
            this.description = source.getDescription();
            this.interfaces = source.getInterfaces();
            this.widgetDescriptorKey = source.getWidgetDescriptorKey();
            this.config = source.getConfig();
            this.context = source.getContext();
        }
    }

    private static makeWidgetDescriptorKey(key: string): WidgetDescriptorKey {
        const applicationKey = key.split(':')[0];
        const descriptorKeyName = key.split(':')[1];
        return new WidgetDescriptorKey(ApplicationKey.fromString(applicationKey), descriptorKeyName);
    }

    fromJson(json: WidgetDescriptorJson): WidgetBuilder {
        this.url = json.url;
        this.iconUrl = json.iconUrl;
        this.displayName = json.displayName;
        this.description = json.description;
        this.interfaces = json.interfaces;
        this.widgetDescriptorKey = WidgetBuilder.makeWidgetDescriptorKey(json.key);
        this.config = new WidgetConfig().fromJson(json.config);

        return this;
    }

    setUrl(url: string): WidgetBuilder {
        this.url = url;
        return this;
    }

    setIconUrl(iconUrl: string): WidgetBuilder {
        this.iconUrl = iconUrl;
        return this;
    }

    setDisplayName(displayName: string): WidgetBuilder {
        this.displayName = displayName;
        return this;
    }

    setDescription(description: string): WidgetBuilder {
        this.description = description;
        return this;
    }

    setWidgetDescriptorKey(keyAsString: string): WidgetBuilder {
        this.widgetDescriptorKey = WidgetDescriptorKey.fromString(keyAsString);
        return this;
    }

    setConfig(config: WidgetConfig): WidgetBuilder {
        this.config = config;
        return this;
    }

    setContext(context: string): WidgetBuilder {
        this.context = context;
        return this;
    }

    build(): Widget {
        return new Widget(this);
    }
}

export class WidgetDescriptorKey
    implements Equitable {

    private static SEPARATOR: string = ':';

    private readonly applicationKey: ApplicationKey;

    private readonly name: string;

    private readonly refString: string;

    constructor(applicationKey: ApplicationKey, name: string) {
        this.applicationKey = applicationKey;
        this.name = name;
        this.refString = applicationKey.toString() + WidgetDescriptorKey.SEPARATOR + name.toString();
    }

    public static fromString(str: string): WidgetDescriptorKey {
        let sepIndex: number = str.indexOf(WidgetDescriptorKey.SEPARATOR);
        if (sepIndex === -1) {
            throw new Error(`WidgetDescriptorKey must contain separator '${WidgetDescriptorKey.SEPARATOR}':${str}`);
        }

        let applicationKey = str.substring(0, sepIndex);
        let name = str.substring(sepIndex + 1, str.length);

        return new WidgetDescriptorKey(ApplicationKey.fromString(applicationKey), name);
    }

    getApplicationKey(): ApplicationKey {
        return this.applicationKey;
    }

    getName(): string {
        return this.name;
    }

    toString(): string {
        return this.refString;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, WidgetDescriptorKey)) {
            return false;
        }

        let other = o as WidgetDescriptorKey;

        if (!ObjectHelper.stringEquals(this.refString, other.refString)) {
            return false;
        }

        return true;
    }
}

export class WidgetConfig {
    private map: Map<string, string>;

    constructor() {
        this.map = new Map<string, any>();
    }

    fromJson(json: Record<string, string>): WidgetConfig {
        Object.keys(json).forEach((key) => {
            this.setProperty(key, json[key]);
        });

        return this;
    }

    setProperty(name: string, value: string): WidgetConfig {
        this.map.set(name, value);
        return this;
    }

    getProperty(name: string): string {
        return this.map.get(name);
    }
}
