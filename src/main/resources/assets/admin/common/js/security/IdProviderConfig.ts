import {PropertyTreeHelper} from '../util/PropertyTreeHelper';
import {Equitable} from '../Equitable';
import {ApplicationKey} from '../application/ApplicationKey';
import {PropertyTree} from '../data/PropertyTree';
import {ObjectHelper} from '../ObjectHelper';
import {IdProviderConfigJson} from './IdProviderConfigJson';

export class IdProviderConfig
    implements Equitable {
    private applicationKey: ApplicationKey;
    private config: PropertyTree;

    constructor(builder: IdProviderConfigBuilder) {
        this.applicationKey = builder.applicationKey;
        this.config = builder.config;
    }

    static create(): IdProviderConfigBuilder {
        return new IdProviderConfigBuilder();
    }

    static fromJson(json: IdProviderConfigJson): IdProviderConfig {
        return new IdProviderConfigBuilder().fromJson(json).build();
    }

    getApplicationKey(): ApplicationKey {
        return this.applicationKey;
    }

    getConfig(): PropertyTree {
        return this.config;
    }

    equals(o: Equitable, ignoreEmptyValues: boolean = false): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, IdProviderConfig)) {
            return false;
        }

        let other = o as IdProviderConfig;

        return this.applicationKey.equals(other.applicationKey) &&
               PropertyTreeHelper.propertyTreesEqual(this.config, other.config, ignoreEmptyValues);
    }

    toJson(): IdProviderConfigJson {
        return {
            applicationKey: this.applicationKey.toString(),
            config: this.config.toJson()
        };
    }

    clone(): IdProviderConfig {
        return IdProviderConfig.create().setApplicationKey(this.applicationKey).setConfig(this.config.copy()).build();
    }

}

export class IdProviderConfigBuilder {
    applicationKey: ApplicationKey;
    config: PropertyTree;

    setApplicationKey(applicationKey: ApplicationKey): IdProviderConfigBuilder {
        this.applicationKey = applicationKey;
        return this;
    }

    setConfig(config: PropertyTree): IdProviderConfigBuilder {
        this.config = config;
        return this;
    }

    fromJson(json: IdProviderConfigJson): IdProviderConfigBuilder {
        this.applicationKey = ApplicationKey.fromString(json.applicationKey);
        this.config = json.config != null ? PropertyTree.fromJson(json.config) : null;
        return this;
    }

    build(): IdProviderConfig {
        return new IdProviderConfig(this);
    }
}
