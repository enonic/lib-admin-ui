import {PropertyTree} from '../data/PropertyTree';
import {ObjectHelper} from '../ObjectHelper';

export class PropertyTreeHelper {

    static trimPropertyTree(data: PropertyTree): PropertyTree {
        const copy: PropertyTree = data.copy();
        copy.removeEmptyValues();

        return copy;
    }

    static propertyTreesEqual(config: PropertyTree, otherConfig: PropertyTree, ignoreEmptyValues: boolean = true): boolean {
        if (ignoreEmptyValues) {
            return PropertyTreeHelper.propertyTreesEqualIgnoreEmptyValues(config, otherConfig);
        }

        return ObjectHelper.equals(config, otherConfig);
    }

    static propertyTreesEqualIgnoreEmptyValues(config: PropertyTree, otherConfig: PropertyTree): boolean {
        if (PropertyTreeHelper.bothEmpty(config, otherConfig)) {
            return true;
        }

        const data: PropertyTree = config ? PropertyTreeHelper.trimPropertyTree(config) : config;
        const otherData: PropertyTree = otherConfig ? PropertyTreeHelper.trimPropertyTree(otherConfig) : otherConfig;

        return ObjectHelper.equals(data, otherData);
    }

    private static bothEmpty(config: PropertyTree, otherConfig: PropertyTree): boolean {
        if (PropertyTreeHelper.isEmpty(config) && PropertyTreeHelper.isEmpty(otherConfig)) {
            return true;
        }

        return false;
    }

    private static isEmpty(config: PropertyTree): boolean {
        return !config || config.isEmpty();
    }
}
