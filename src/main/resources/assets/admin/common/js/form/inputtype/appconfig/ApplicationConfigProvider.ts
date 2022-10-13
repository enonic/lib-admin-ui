import {Property} from '../../../data/Property';
import {PropertyArray} from '../../../data/PropertyArray';
import {ApplicationKey} from '../../../application/ApplicationKey';
import {ApplicationConfig} from '../../../application/ApplicationConfig';
import {PropertySet} from '../../../data/PropertySet';

export class ApplicationConfigProvider {

    private propertyArray: PropertyArray;

    private arrayChangedListeners: { (): void }[] = [];

    private beforeArrayChangedListeners: { (): void }[] = [];

    private afterArrayChangedListeners: { (): void }[] = [];

    constructor(propertyArray: PropertyArray) {
        this.setPropertyArray(propertyArray);
    }

    setPropertyArray(propertyArray: PropertyArray) {
        this.propertyArray = propertyArray;
        this.notifyPropertyChanged();
    }

    getConfig(applicationKey: ApplicationKey): ApplicationConfig {
        if (!applicationKey) {
            return null;
        }

        let match: ApplicationConfig = null;

        this.propertyArray.forEach((property: Property) => {
            if (property.hasNonNullValue()) {
                const applicationConfigAsSet: PropertySet = property.getPropertySet();
                const applicationConfig: ApplicationConfig = ApplicationConfig.create().fromData(applicationConfigAsSet).build();

                if (applicationConfig.getApplicationKey().equals(applicationKey)) {
                    match = applicationConfig;
                }
            }
        });

        return match;
    }

    addConfig(applicationKey: ApplicationKey): ApplicationConfig {
        this.notifyBeforePropertyChanged();

        const applicationConfigAsSet: PropertySet = this.propertyArray.addSet();
        applicationConfigAsSet.addString(ApplicationConfig.PROPERTY_KEY, applicationKey.toString());
        applicationConfigAsSet.addPropertySet(ApplicationConfig.PROPERTY_CONFIG);

        const newApplicationConfig = ApplicationConfig.create().fromData(applicationConfigAsSet).build();

        this.notifyAfterPropertyChanged();
        return newApplicationConfig;
    }

    onPropertyChanged(listener: () => void) {
        this.arrayChangedListeners.push(listener);
    }

    unPropertyChanged(listener: () => void) {
        this.arrayChangedListeners = this.arrayChangedListeners.filter((currentListener: () => void) => {
            return currentListener !== listener;
        });
    }

    onBeforePropertyChanged(listener: () => void) {
        this.beforeArrayChangedListeners.push(listener);
    }

    unBeforePropertyChanged(listener: () => void) {
        this.beforeArrayChangedListeners = this.beforeArrayChangedListeners.filter((currentListener: () => void) => {
            return currentListener !== listener;
        });
    }

    onAfterPropertyChanged(listener: () => void) {
        this.afterArrayChangedListeners.push(listener);
    }

    unAfterPropertyChanged(listener: () => void) {
        this.afterArrayChangedListeners = this.afterArrayChangedListeners.filter((currentListener: () => void) => {
            return currentListener !== listener;
        });
    }

    private notifyPropertyChanged() {
        this.arrayChangedListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }

    private notifyBeforePropertyChanged() {
        this.beforeArrayChangedListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }

    private notifyAfterPropertyChanged() {
        this.afterArrayChangedListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }
}
