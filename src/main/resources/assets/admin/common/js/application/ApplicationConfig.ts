import {PropertySet} from '../data/PropertySet';
import {PropertyTree} from '../data/PropertyTree';
import {ApplicationKey} from './ApplicationKey';
import {Equitable} from '../Equitable';
import {Cloneable} from '../Cloneable';
import {ObjectHelper} from '../ObjectHelper';
import {assertNotNull} from '../util/Assert';

export class ApplicationConfig
    implements Equitable, Cloneable {

    public static PROPERTY_CONFIG = 'config';

    public static PROPERTY_KEY = 'applicationKey';

    private readonly applicationKey: ApplicationKey;

    private readonly config: PropertySet;

    constructor(builder: ApplicationConfigBuilder) {
        this.applicationKey = builder.applicationKey;
        this.config = builder.config;
    }

    static create(): ApplicationConfigBuilder {
        return new ApplicationConfigBuilder();
    }

    getApplicationKey(): ApplicationKey {
        return this.applicationKey;
    }

    getConfig(): PropertySet {
        return this.config;
    }

    toJson(): object {
        return {
            applicationKey: this.applicationKey.toString(),
            config: this.config.toJson()
        };
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ApplicationConfig)) {
            return false;
        }

        let other = o as ApplicationConfig;

        if (!ObjectHelper.equals(this.applicationKey, other.applicationKey)) {
            return false;
        }

        if (!ObjectHelper.equals(this.config, other.config)) {
            return false;
        }

        return true;
    }

    clone(): ApplicationConfig {

        return new ApplicationConfigBuilder(this).build();
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
        assertNotNull(propertySet, 'data cannot be null');

        const applicationKey: ApplicationKey = ApplicationKey.fromString(propertySet.getString(ApplicationConfig.PROPERTY_KEY));
        const config: PropertySet = propertySet.getPropertySet(ApplicationConfig.PROPERTY_CONFIG);
        this.setApplicationKey(applicationKey);
        this.setConfig(config);

        return this;
    }

    setApplicationKey(value: ApplicationKey): ApplicationConfigBuilder {
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
