import {PropertyArray} from '../../../data/PropertyArray';
import {Property} from '../../../data/Property';
import {Value} from '../../../data/Value';
import {ValueTypeString} from '../../../data/ValueTypeString';

export class OptionSetArrayHelper {

    private readonly propertyArray: PropertyArray;

    constructor(propertyArray: PropertyArray) {
        this.propertyArray = propertyArray;
    }

    add(name: string, isSingleSelection?: boolean): void {
        if (isSingleSelection) {
            this.overwriteOrAddNew(name);
        } else {
            this.addNewAndSort(name);
        }
    }

    private overwriteOrAddNew(name): void {
        const value: Value = new Value(name, new ValueTypeString());
        const existingProperty: Property = this.propertyArray.get(0);

        if (existingProperty) {
            existingProperty.setValue(value);
        } else {
            this.propertyArray.set(0, value);
        }
    }

    private addNewAndSort(name): void {
        const value: Value = new Value(name, new ValueTypeString());

        if (!this.propertyArray.containsValue(value)) {
            this.propertyArray.add(value);

            if (this.propertyArray.getSize() > 1) {
                this.sortByName();
            }
        }
    }

    sortByName(): void {
        const sorted: Property[] = this.propertyArray.getProperties().sort((a: Property, b: Property) => {
            return a.getValue().getString().localeCompare(b.getValue().getString());
        });

        sorted.forEach((sortedProperty: Property, to: number) => {
            this.propertyArray.some((existingProperty: Property, from: number) => {
                if (sortedProperty.equals(existingProperty)) {
                    if (from !== to) {
                        this.propertyArray.move(from, to);
                    }

                    return true;
                }

                return false;
            });
        });
    }

    remove(name: string): void {
        const selectionArrayPropertyToRemove: Property = this.getPropertyByName(name);

        if (selectionArrayPropertyToRemove) {
            this.propertyArray.remove(selectionArrayPropertyToRemove.getIndex());
        }
    }

    private getPropertyByName(name: string): Property {
        let result: Property = null;

        this.propertyArray?.forEach((property: Property) => {
            if (property.getString() === name) {
                result = property;
            }
        });

        return result;
    }
}
