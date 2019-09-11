import {OrderExprJson} from '../json/OrderExprJson';
import {OrderExprWrapperJson} from '../json/OrderExprWrapperJson';
import {Equitable} from '../../Equitable';
import {ObjectHelper} from '../../ObjectHelper';
import {FieldOrderExpr} from './FieldOrderExpr';
import {DynamicOrderExpr} from './DynamicOrderExpr';

export class OrderExpr
    implements Equitable {

    private direction: string;

    constructor(builder: OrderExprBuilder) {
        this.direction = builder.direction;
    }

    static toArrayJson(expressions: OrderExpr[]): OrderExprWrapperJson[] {
        let wrappers: OrderExprWrapperJson[] = [];
        expressions.forEach((expr: OrderExpr) => {
            if (ObjectHelper.iFrameSafeInstanceOf(expr, FieldOrderExpr)) {
                wrappers.push(<OrderExprWrapperJson>{FieldOrderExpr: expr.toJson()});
            } else if (ObjectHelper.iFrameSafeInstanceOf(expr, DynamicOrderExpr)) {
                wrappers.push(<OrderExprWrapperJson>{DynamicOrderExpr: expr.toJson()});
            }
        });
        return wrappers;
    }

    getDirection(): string {
        return this.direction;
    }

    toJson(): OrderExprJson {
        throw new Error('Must be implemented by inheritors');
    }

    toString(): string {
        throw new Error('Must be implemented by inheritors');
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, OrderExpr)) {
            return false;
        }
        let other = <OrderExpr>o;
        if (this.direction.toLowerCase() !== other.getDirection().toLowerCase()) {
            return false;
        }
        return true;
    }

}

export class OrderExprBuilder {

    direction: string;

    constructor(json?: OrderExprJson) {
        if (json) {
            this.direction = json.direction;
        }
    }

    public setDirection(value: string): OrderExprBuilder {
        this.direction = value;
        return this;
    }

    public build(): OrderExpr {
        return new OrderExpr(this);
    }
}
