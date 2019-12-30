import {Expression} from './Expression';
import {ValueExpr} from './ValueExpr';

export class FunctionExpr
    implements Expression {

    private name: string;
    private args: ValueExpr[] = [];

    constructor(name: string, args: ValueExpr[]) {
        this.name = name;
        this.args = args;
    }

    getName(): string {
        return this.name;
    }

    getargs(): ValueExpr[] {
        return this.args;
    }

    toString() {
        let result: string = this.name;
        result = result.concat('(');

        let sub = [];
        this.args.forEach((expr: ValueExpr) => {
            sub.push(expr.toString());
        });
        result = result.concat(sub.join(', '));

        result = result.concat(')');

        return result;
    }
}
