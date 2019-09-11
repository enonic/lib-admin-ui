import {ValueExpr} from './expr/ValueExpr';
import {FunctionExpr} from './expr/FunctionExpr';
import {DynamicConstraintExpr} from './expr/DynamicConstraintExpr';
import {LogicalExpr} from './expr/LogicalExpr';
import {LogicalOperator} from './expr/LogicalOperator';
import {CompareExpr} from './expr/CompareExpr';
import {FieldExpr} from './expr/FieldExpr';
import {Expression} from './expr/Expression';
import {FulltextSearchExpression, FulltextSearchExpressionBuilder} from './FulltextSearchExpression';
import {QueryField} from './QueryField';
import {QueryFields} from './QueryFields';

export class PathMatchExpression
    extends FulltextSearchExpression {

    static createWithPath(searchString: string, queryFields: QueryFields, path: string): Expression {

        let fulltextExpr = FulltextSearchExpression.create(searchString, queryFields);

        let pathExpr = this.createPathMatchExpression(searchString);

        let nameOrPathExpr: LogicalExpr = new LogicalExpr(fulltextExpr, LogicalOperator.OR, pathExpr);

        let args = [];
        args.push(ValueExpr.stringValue('_path'));
        args.push(ValueExpr.stringValue('/content' + path));

        let matchedExpr: FunctionExpr = new FunctionExpr('pathMatch', args);
        let matchedDynamicExpr: DynamicConstraintExpr = new DynamicConstraintExpr(matchedExpr);

        let booleanExpr: LogicalExpr = new LogicalExpr(nameOrPathExpr, LogicalOperator.AND, matchedDynamicExpr);
        return booleanExpr;
    }

    private static createPathMatchExpression(searchString: string): Expression {

        let pathExpr = CompareExpr.like(new FieldExpr('_path'),
            ValueExpr.string(this.createSearchString(searchString)));

        return pathExpr;
    }

    private static createSearchString(searchString: string): string {

        if (!!searchString && searchString.indexOf('/') === 0) {
            searchString = searchString.slice(1);
        }

        return '/content/*' + searchString + '*';
    }
}

export class PathMatchExpressionBuilder
    extends FulltextSearchExpressionBuilder {

    path: string;

    addField(queryField: QueryField): PathMatchExpressionBuilder {
        super.addField(queryField);
        return this;
    }

    setSearchString(searchString: string): PathMatchExpressionBuilder {
        super.setSearchString(searchString);
        return this;
    }

    setPath(path: string): PathMatchExpressionBuilder {
        this.path = path;
        return this;
    }

    build(): Expression {
        return PathMatchExpression.createWithPath(this.searchString, this.queryFields, this.path);
    }
}
