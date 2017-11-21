module api.data {

    export class ValueTypeReference extends ValueType {

        constructor() {
            super('Reference');
        }

        isValid(value: any): boolean {

            if (!(typeof value === 'object')) {
                return false;
            }

            if (!api.ObjectHelper.iFrameSafeInstanceOf(value, api.util.Reference)) {
                return false;
            }
            return true;
        }

        isConvertible(value: string): boolean {
            return !api.util.StringHelper.isBlank(value);
        }

        newValue(value: string): Value {
            if (this.isConvertible(value)) {
                return new Value(new api.util.Reference(value), this);
            } else {
                return this.newNullValue();
            }
        }

        valueToString(value: Value): string {
            if (value.isNotNull()) {
                return value.getReference().toString();
            } else {
                return null;
            }
        }

        toJsonValue(value: Value): any {
            return value.isNull() ? null : value.getReference().toString();
        }

        valueEquals(a: api.util.Reference, b: api.util.Reference): boolean {
            return api.ObjectHelper.equals(a, b);
        }
    }
}
