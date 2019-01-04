module api.security {
    export class IdProviderConfig
        implements api.Equitable {
        private applicationKey: api.application.ApplicationKey;
        private config: api.data.PropertyTree;

        constructor(builder: IdProviderConfigBuilder) {
            this.applicationKey = builder.applicationKey;
            this.config = builder.config;
        }

        getApplicationKey(): api.application.ApplicationKey {
            return this.applicationKey;
        }

        getConfig(): api.data.PropertyTree {
            return this.config;
        }

        static create(): IdProviderConfigBuilder {
            return new IdProviderConfigBuilder();
        }

        static fromJson(json: IdProviderConfigJson): IdProviderConfig {
            return new IdProviderConfigBuilder().fromJson(json).build();
        }

        equals(o: api.Equitable): boolean {
            if (!api.ObjectHelper.iFrameSafeInstanceOf(o, IdProviderConfig)) {
                return false;
            }

            let other = <IdProviderConfig> o;

            return this.applicationKey.equals(other.applicationKey) &&
                   this.config.equals(other.config);
        }

        toJson(): IdProviderConfigJson {
            return {
                applicationKey: this.applicationKey.toString(),
                config: this.config.toJson()
            };
        }

        clone(): IdProviderConfig {
            return IdProviderConfig.create().
                setApplicationKey(this.applicationKey).
                setConfig(this.config.copy()).
                build();
        }

    }

    export class IdProviderConfigBuilder {
        applicationKey: api.application.ApplicationKey;
        config: api.data.PropertyTree;

        setApplicationKey(applicationKey: api.application.ApplicationKey): IdProviderConfigBuilder {
            this.applicationKey = applicationKey;
            return this;
        }

        setConfig(config: api.data.PropertyTree): IdProviderConfigBuilder {
            this.config = config;
            return this;
        }

        fromJson(json: api.security.IdProviderConfigJson): IdProviderConfigBuilder {
            this.applicationKey = api.application.ApplicationKey.fromString(json.applicationKey);
            this.config = json.config != null ? api.data.PropertyTree.fromJson(json.config) : null;
            return this;
        }

        build(): IdProviderConfig {
            return new IdProviderConfig(this);
        }
    }
}
