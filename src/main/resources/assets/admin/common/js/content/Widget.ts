module api.content {

    import ApplicationKey = api.application.ApplicationKey;
    import WidgetDescriptorJson = api.content.json.WidgetDescriptorJson;

    export class Widget {

        private url: string;
        private iconUrl: string;
        private displayName: string;
        private description: string;
        private interfaces: string[];
        private widgetDescriptorKey: WidgetDescriptorKey;
        private config: { [key: string]: string };

        constructor(builder: WidgetBuilder) {
            this.url = builder.url;
            this.iconUrl = builder.iconUrl;
            this.displayName = builder.displayName;
            this.description = builder.description;
            this.interfaces = builder.interfaces;
            this.widgetDescriptorKey = builder.widgetDescriptorKey;
            this.config = builder.config;
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

        public getWidgetDescriptorKey(): api.content.WidgetDescriptorKey {
            return this.widgetDescriptorKey;
        }

        public getConfig(): { [key: string]: string } {
            return this.config;
        }

        static create(): WidgetBuilder {
            return new WidgetBuilder();
        }

        static fromJson(json: WidgetDescriptorJson): Widget {
            return new WidgetBuilder().fromJson(json).build();
        }

    }

    export class WidgetBuilder {

        url: string;

        iconUrl: string;

        displayName: string;

        description: string;

        interfaces: string[];

        widgetDescriptorKey: WidgetDescriptorKey;

        config: { [key: string]: string };

        constructor(source?: Widget) {
            if (source) {
                this.url = source.getUrl();
                this.iconUrl = source.getIconUrl();
                this.displayName = source.getDisplayName();
                this.description = source.getDescription();
                this.interfaces = source.getInterfaces();
                this.widgetDescriptorKey = source.getWidgetDescriptorKey();
                this.config = source.getConfig();
            } else {
                this.interfaces = [];
                this.config = {};
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
            this.config = json.config;

            return this;
        }

        build(): Widget {
            return new Widget(this);
        }
    }

    export class WidgetDescriptorKey
        implements api.Equitable {

        private static SEPARATOR: string = ':';

        private applicationKey: ApplicationKey;

        private name: string;

        private refString: string;

        public static fromString(str: string): WidgetDescriptorKey {
            let sepIndex: number = str.indexOf(WidgetDescriptorKey.SEPARATOR);
            if (sepIndex === -1) {
                throw new Error(`WidgetDescriptorKey must contain separator '${WidgetDescriptorKey.SEPARATOR}':${str}`);
            }

            let applicationKey = str.substring(0, sepIndex);
            let name = str.substring(sepIndex + 1, str.length);

            return new WidgetDescriptorKey(ApplicationKey.fromString(applicationKey), name);
        }

        constructor(applicationKey: ApplicationKey, name: string) {
            this.applicationKey = applicationKey;
            this.name = name;
            this.refString = applicationKey.toString() + WidgetDescriptorKey.SEPARATOR + name.toString();
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

        equals(o: api.Equitable): boolean {

            if (!api.ObjectHelper.iFrameSafeInstanceOf(o, WidgetDescriptorKey)) {
                return false;
            }

            let other = <WidgetDescriptorKey>o;

            if (!api.ObjectHelper.stringEquals(this.refString, other.refString)) {
                return false;
            }

            return true;
        }
    }
}
