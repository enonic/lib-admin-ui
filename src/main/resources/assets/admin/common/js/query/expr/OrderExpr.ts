import {Expression} from './Expression';
import {OrderDirection} from './OrderDirection';

export class OrderExpr
    implements Expression {

    private direction: OrderDirection;

    constructor(direction: OrderDirection) {
        this.direction = direction;
    }

    getDirection(): OrderDirection {
        return this.direction;
    }

    directionAsString(): string {
        switch (this.direction) {
        case OrderDirection.ASC:
            return 'ASC';
        case OrderDirection.DESC:
            return 'DESC';
        default:
            return '';
        }
    }
}
