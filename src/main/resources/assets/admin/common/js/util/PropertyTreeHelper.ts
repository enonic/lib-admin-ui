module api.util {

    import PropertyTree = api.data.PropertyTree;

    export class PropertyTreeHelper {

        static trimPropertyTree(data: PropertyTree): PropertyTree {
            const copy: PropertyTree = data.copy();
            copy.getRoot().removeEmptyValues();

            return copy;
        }

        static propertyTreesEqual(config: PropertyTree, otherConfig: PropertyTree, ignoreEmptyValues: boolean = true): boolean {
            if (ignoreEmptyValues) {
                return PropertyTreeHelper.propertyTreesEqualIgnoreEmptyValues(config, otherConfig);
            }

            return api.ObjectHelper.equals(config, otherConfig);
        }

        static propertyTreesEqualIgnoreEmptyValues(config: PropertyTree, otherConfig: PropertyTree): boolean {
            if (PropertyTreeHelper.bothEmpty(config, otherConfig)) {
                return true;
            }

            const data: PropertyTree = config ? PropertyTreeHelper.trimPropertyTree(config) : config;
            const otherData: PropertyTree = otherConfig ? PropertyTreeHelper.trimPropertyTree(otherConfig) : otherConfig;

            return api.ObjectHelper.equals(data, otherData);
        }

        private static bothEmpty(config: PropertyTree, otherConfig: PropertyTree): boolean {
            if ((!config || config.isEmpty()) && (!otherConfig || otherConfig.isEmpty())) {
                return true;
            }

            return false;
        }
    }
}
