import {Expression} from './Expression';
import {ConstraintExpr} from './ConstraintExpr';
import {OrderExpr} from './OrderExpr';

export class QueryExpr
    implements Expression {

    private constraint: ConstraintExpr;
    private orderList: OrderExpr[] = [];

    constructor(constraint: ConstraintExpr, orderList?: OrderExpr[]) {
        this.constraint = constraint;
        if (orderList) {
            this.orderList = orderList;
        }
    }

    getConstraint(): ConstraintExpr {
        return this.constraint;
    }

    getOrderList(): OrderExpr[] {
        return this.orderList;
    }

    toString() {
        let result: string = '';

        if (this.constraint != null) {
            result = result.concat(String(this.constraint));
        }

        if (this.orderList.length > 0) {
            result = result.concat(' ORDER BY ');

            let sub = [];
            this.orderList.forEach((expr: OrderExpr) => {
                sub.push(String(expr));
            });
            result = result.concat(sub.join(', '));
        }

        return result;
    }
}
