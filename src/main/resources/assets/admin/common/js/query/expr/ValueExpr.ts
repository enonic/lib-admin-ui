import {Value} from '../../data/Value';
import {ValueTypes} from '../../data/ValueTypes';
import {ValueType} from '../../data/ValueType';
import {Expression} from './Expression';

export class ValueExpr
    implements Expression {

    private value: Value;

    constructor(value: Value) {
        this.value = value;
    }

    static stringValue(value: string): ValueExpr {
        return new ValueExpr(new Value(value, ValueTypes.STRING));
    }

    public static string(value: string): ValueExpr {
        return new ValueExpr(new Value(value, ValueTypes.STRING));
    }

    public static number(value: number): ValueExpr {
        return new ValueExpr(new Value(value, ValueTypes.DOUBLE));
    }

    public static dateTime(value: Date): ValueExpr {
        return new ValueExpr(new Value(value, ValueTypes.DATE_TIME));
    }

    public static geoPoint(value: string): ValueExpr {
        return new ValueExpr(new Value(value, ValueTypes.GEO_POINT));
    }

    getValue(): Value {
        return this.value;
    }

    toString() {
        let type: ValueType = this.value.getType();

        if (type === ValueTypes.DOUBLE) {
            return this.value.getString();
        }

        if (type === ValueTypes.DATE_TIME) {
            return this.typecastFunction('dateTime', this.value.getString());
        }

        if (type === ValueTypes.GEO_POINT) {
            return this.typecastFunction('geoPoint', this.value.getString());
        }

        return this.quoteString(this.value.getString());
    }

    private typecastFunction(name: string, argument: string): string {
        return name + '(' + this.quoteString(argument) + ')';
    }

    private quoteString(value: string): string {
        if (value.indexOf('\'') > -1) {
            return `"${value}"`;
        } else {
            return `'${value}'`;
        }
    }
}
