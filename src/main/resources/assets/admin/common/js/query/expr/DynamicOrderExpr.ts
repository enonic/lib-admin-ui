import {OrderExpr} from './OrderExpr';
import {FunctionExpr} from './FunctionExpr';
import {OrderDirection} from './OrderDirection';

export class DynamicOrderExpr
    extends OrderExpr {

    private func: FunctionExpr;

    constructor(func: FunctionExpr, direction: OrderDirection) {
        super(direction);
        this.func = func;
    }

    getFunction(): FunctionExpr {
        return this.func;
    }

    toString() {
        return this.func.toString() + ' ' + super.directionAsString();
    }
}
