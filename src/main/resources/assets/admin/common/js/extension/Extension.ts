import {ApplicationKey} from '../application/ApplicationKey';
import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';
import {ExtensionDescriptorJson} from './ExtensionDescriptorJson';
import {CONFIG} from '../util/Config';

export class Extension<B extends ExtensionBuilder = ExtensionBuilder, C extends ExtensionConfig = ExtensionConfig> {

    private readonly url: string;
    private readonly iconUrl: string;
    private readonly title: string;
    private readonly description: string;
    private readonly interfaces: string[];
    private readonly extensionDescriptorKey: ExtensionDescriptorKey;
    private readonly config: C;

    constructor(builder: B) {
        this.url = builder.url;
        this.iconUrl = builder.iconUrl;
        this.title = builder.title;
        this.description = builder.description;
        this.interfaces = builder.interfaces;
        this.extensionDescriptorKey = builder.extensionDescriptorKey;
        this.config = (builder.config || this.createConfig()) as C;
    }

    protected createConfig(): C {
        return new ExtensionConfig() as C;
    }

    static create<C extends ExtensionConfig>(): ExtensionBuilder<C> {
        return new ExtensionBuilder<C>();
    }

    static fromJson<C extends ExtensionConfig>(json: ExtensionDescriptorJson): Extension {
        return new ExtensionBuilder<C>().fromJson(json).build();
    }

    public getUrl(): string {
        return this.url;
    }

    public getIconUrl(): string {
        return this.iconUrl;
    }

    public getFullUrl(): string {
        return `${this.getBaseUrl()}/${this.url}`;
    }

    public getFullIconUrl(): string {
        return `${this.getBaseUrl()}${this.iconUrl}`;
    }

    private getBaseUrl(): string {
        return (CONFIG.getString('extensionApiUrl') || '').replace(/\/+$/, '');
    }

    public getDisplayName(): string {
        return this.title;
    }

    public getDescription(): string {
        return this.description;
    }

    public getInterfaces(): string[] {
        return this.interfaces;
    }

    public getDescriptorKey(): ExtensionDescriptorKey {
        return this.extensionDescriptorKey;
    }

    public getConfig(): C {
        return this.config;
    }
}

export class ExtensionBuilder<C extends ExtensionConfig = ExtensionConfig> {

    url: string;

    iconUrl: string;

    title: string;

    description: string;

    interfaces: string[];

    extensionDescriptorKey: ExtensionDescriptorKey;

    config: C;

    constructor(source?: Extension) {
        if (source) {
            this.url = source.getUrl();
            this.iconUrl = source.getIconUrl();
            this.title = source.getDisplayName();
            this.description = source.getDescription();
            this.interfaces = source.getInterfaces();
            this.extensionDescriptorKey = source.getDescriptorKey();
            this.config = source.getConfig() as C;
        }
    }

    private static makeExtensionDescriptorKey(key: string): ExtensionDescriptorKey {
        const applicationKey = key.split(':')[0];
        const descriptorKeyName = key.split(':')[1];
        return new ExtensionDescriptorKey(ApplicationKey.fromString(applicationKey), descriptorKeyName);
    }

    fromJson(json: ExtensionDescriptorJson): ExtensionBuilder {
        this.url = json.url;
        this.iconUrl = json.iconUrl;
        this.title = json.title;
        this.description = json.description;
        this.interfaces = json.interfaces;
        this.extensionDescriptorKey = ExtensionBuilder.makeExtensionDescriptorKey(json.key);
        this.config = this.createConfig(json.config);
        return this;
    }

    protected createConfig(json: Record<string, string>): C {
        return new ExtensionConfig().fromJson(json) as C;
    }

    setUrl(url: string): ExtensionBuilder {
        this.url = url;
        return this;
    }

    setIconUrl(iconUrl: string): ExtensionBuilder {
        this.iconUrl = iconUrl;
        return this;
    }

    setDisplayName(title: string): ExtensionBuilder {
        this.title = title;
        return this;
    }

    setDescription(description: string): ExtensionBuilder {
        this.description = description;
        return this;
    }

    setExtensionDescriptorKey(keyAsString: string): ExtensionBuilder {
        this.extensionDescriptorKey = ExtensionDescriptorKey.fromString(keyAsString);
        return this;
    }

    setConfig(config: C): ExtensionBuilder {
        this.config = config;
        return this;
    }

    build(): Extension {
        return new Extension(this);
    }
}

export class ExtensionDescriptorKey
    implements Equitable {

    private static SEPARATOR: string = ':';

    private readonly applicationKey: ApplicationKey;

    private readonly name: string;

    private readonly refString: string;

    constructor(applicationKey: ApplicationKey, name: string) {
        this.applicationKey = applicationKey;
        this.name = name;
        this.refString = applicationKey.toString() + ExtensionDescriptorKey.SEPARATOR + name.toString();
    }

    public static fromString(str: string): ExtensionDescriptorKey {
        let sepIndex: number = str.indexOf(ExtensionDescriptorKey.SEPARATOR);
        if (sepIndex === -1) {
            throw new Error(`ExtensionDescriptorKey must contain separator '${ExtensionDescriptorKey.SEPARATOR}':${str}`);
        }

        let applicationKey = str.substring(0, sepIndex);
        let name = str.substring(sepIndex + 1, str.length);

        return new ExtensionDescriptorKey(ApplicationKey.fromString(applicationKey), name);
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

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ExtensionDescriptorKey)) {
            return false;
        }

        let other = o as ExtensionDescriptorKey;

        if (!ObjectHelper.stringEquals(this.refString, other.refString)) {
            return false;
        }

        return true;
    }
}

export class ExtensionConfig {
    private map: Map<string, string>;

    constructor() {
        this.map = new Map<string, any>();
    }

    fromJson(json: Record<string, string>): ExtensionConfig {
        Object.keys(json).forEach((key) => {
            this.setProperty(key, json[key]);
        });

        return this;
    }

    setProperty(name: string, value: string): ExtensionConfig {
        this.map.set(name, value);
        return this;
    }

    getProperty(name: string): string {
        return this.map.get(name);
    }
}
