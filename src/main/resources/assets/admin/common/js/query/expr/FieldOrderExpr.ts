import {OrderExpr} from './OrderExpr';
import {FieldExpr} from './FieldExpr';
import {OrderDirection} from './OrderDirection';

export class FieldOrderExpr
    extends OrderExpr {

    private field: FieldExpr;

    constructor(field: FieldExpr, direction: OrderDirection) {
        super(direction);
        this.field = field;
    }

    getField(): FieldExpr {
        return this.field;
    }

    toString() {
        return this.field.toString() + ' ' + super.directionAsString();
    }
}
