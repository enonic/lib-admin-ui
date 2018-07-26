module api.data {

    export class ValueTypePropertySet extends ValueType {

        constructor() {
            super('PropertySet');
        }

        isValid(value: any): boolean {
            if (!(typeof value === 'object')) {
                return false;
            }
            if (!api.ObjectHelper.iFrameSafeInstanceOf(value, PropertySet)) {
                return false;
            }
            return true;
        }

        isConvertible(): boolean {
            return false;
        }

        newValue(): Value {
            throw new Error('A value of type Data cannot be created from a string');
        }

        toJsonValue(value: Value): any {
            if (value.isNull()) {
                return null;
            }
            let data = <PropertySet>value.getObject();
            return data.toJson();
        }

        fromJsonValue(): Value {
            throw new Error('Method not supported!');
        }

        valueToString(): string {
            return null;
        }

        valueEquals(a: PropertySet, b: PropertySet): boolean {
            return api.ObjectHelper.equals(a, b);
        }
    }
}
