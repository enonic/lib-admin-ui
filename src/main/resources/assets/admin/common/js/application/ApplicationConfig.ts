module api.application {
    import PropertySet = api.data.PropertySet;
    import PropertyTree = api.data.PropertyTree;
    import ApplicationKey = api.application.ApplicationKey;

    export class ApplicationConfig
        implements api.Equitable, api.Cloneable {

        private applicationKey: ApplicationKey;

        private config: PropertySet;

        constructor(builder: ApplicationConfigBuilder) {
            this.applicationKey = builder.applicationKey;
            this.config = builder.config;
        }

        getApplicationKey(): api.application.ApplicationKey {
            return this.applicationKey;
        }

        getConfig(): PropertySet {
            return this.config;
        }

        toJson(): Object {
            return {
                applicationKey: this.applicationKey.toString(),
                config: this.config.toJson()
            };
        }

        equals(o: api.Equitable): boolean {

            if (!api.ObjectHelper.iFrameSafeInstanceOf(o, ApplicationConfig)) {
                return false;
            }

            let other = <ApplicationConfig>o;

            if (!api.ObjectHelper.equals(this.applicationKey, other.applicationKey)) {
                return false;
            }

            if (!api.ObjectHelper.equals(this.config, other.config)) {
                return false;
            }

            return true;
        }

        clone(): ApplicationConfig {

            return new ApplicationConfigBuilder(this).build();
        }

        static create(): ApplicationConfigBuilder {
            return new ApplicationConfigBuilder();
        }
    }

    export class ApplicationConfigBuilder {

        applicationKey: ApplicationKey;

        config: PropertySet;

        constructor(source?: ApplicationConfig) {
            if (source) {
                this.applicationKey = source.getApplicationKey();
                if (source.getConfig()) {
                    let newTree = new PropertyTree(source.getConfig());
                    this.config = newTree.getRoot();
                }
            }
        }

        fromData(propertySet: PropertySet): ApplicationConfigBuilder {
            api.util.assertNotNull(propertySet, 'data cannot be null');
            const applicationKey = ApplicationKey.fromString(propertySet.getString('applicationKey'));
            const config = propertySet.getPropertySet('config');
            this.setApplicationKey(applicationKey);
            this.setConfig(config);
            return this;
        }

        setApplicationKey(value: api.application.ApplicationKey): ApplicationConfigBuilder {
            this.applicationKey = value;
            return this;
        }

        setConfig(value: PropertySet): ApplicationConfigBuilder {
            this.config = value;
            return this;
        }

        build(): ApplicationConfig {
            return new ApplicationConfig(this);
        }
    }

}
