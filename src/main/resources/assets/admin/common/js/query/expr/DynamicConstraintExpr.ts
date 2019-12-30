import {ConstraintExpr} from './ConstraintExpr';
import {FunctionExpr} from './FunctionExpr';

export class DynamicConstraintExpr
    implements ConstraintExpr {
    private func: FunctionExpr;

    constructor(func: FunctionExpr) {
        this.func = func;
    }

    getFunction(): FunctionExpr {
        return this.func;
    }

    toString() {
        return this.func.toString();
    }
}
