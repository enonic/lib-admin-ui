import {ConstraintExpr} from './ConstraintExpr';
import {LogicalOperator} from './LogicalOperator';

export class LogicalExpr
    implements ConstraintExpr {

    private left: ConstraintExpr;
    private right: ConstraintExpr;
    private operator: LogicalOperator;

    constructor(left: ConstraintExpr, operator: LogicalOperator, right: ConstraintExpr) {
        this.left = left;
        this.right = right;
        this.operator = operator;
    }

    public static and(left: ConstraintExpr, right: ConstraintExpr): LogicalExpr {
        return new LogicalExpr(left, LogicalOperator.AND, right);
    }

    public static or(left: ConstraintExpr, right: ConstraintExpr): LogicalExpr {
        return new LogicalExpr(left, LogicalOperator.OR, right);
    }

    getLeft(): ConstraintExpr {
        return this.left;
    }

    getRight(): ConstraintExpr {
        return this.right;
    }

    getOperator(): LogicalOperator {
        return this.operator;
    }

    toString() {
        return `(${JSON.stringify(this.left)} ${this.operatorAsString()} ${JSON.stringify(this.right)})`;
    }

    private operatorAsString(): string {
        switch (this.operator) {
        case LogicalOperator.AND:
            return 'AND';
        case LogicalOperator.OR:
            return 'OR';
        default:
            return '';
        }
    }
}
