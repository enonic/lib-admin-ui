module api.form.inputtype.appconfig {

    import Property = api.data.Property;
    import PropertyArray = api.data.PropertyArray;
    import ApplicationKey = api.application.ApplicationKey;
    import ApplicationConfig = api.application.ApplicationConfig;

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

        getConfig(applicationKey: ApplicationKey, addMissing: boolean = true): ApplicationConfig {
            let match: ApplicationConfig = null;

            if (!applicationKey) {
                return match;
            }

            this.propertyArray.forEach((property: Property) => {
                if (property.hasNonNullValue()) {
                    let applicationConfigAsSet = property.getPropertySet();
                    let applicationConfig = ApplicationConfig.create().fromData(applicationConfigAsSet).build();
                    if (applicationConfig.getApplicationKey().equals(applicationKey)) {
                        match = applicationConfig;
                    }
                }
            });

            if (!match && addMissing) {
                this.notifyBeforePropertyChanged();

                let applicationConfigAsSet = this.propertyArray.addSet();
                applicationConfigAsSet.addString('applicationKey', applicationKey.toString());
                applicationConfigAsSet.addPropertySet('config');
                let newApplicationConfig = ApplicationConfig.create().fromData(applicationConfigAsSet).build();

                this.notifyAfterPropertyChanged();
                return newApplicationConfig;

            }
            return match;
        }

        onPropertyChanged(listener: () => void) {
            this.arrayChangedListeners.push(listener);
        }

        unPropertyChanged(listener: () => void) {
            this.arrayChangedListeners = this.arrayChangedListeners.filter((currentListener: () => void) => {
                return currentListener !== listener;
            });
        }

        private notifyPropertyChanged() {
            this.arrayChangedListeners.forEach((listener: () => void) => {
                listener.call(this);
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

        private notifyBeforePropertyChanged() {
            this.beforeArrayChangedListeners.forEach((listener: () => void) => {
                listener.call(this);
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

        private notifyAfterPropertyChanged() {
            this.afterArrayChangedListeners.forEach((listener: () => void) => {
                listener.call(this);
            });
        }
    }
}
