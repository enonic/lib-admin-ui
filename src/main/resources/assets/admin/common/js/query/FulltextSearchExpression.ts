import {ValueExpr} from './expr/ValueExpr';
import {FunctionExpr} from './expr/FunctionExpr';
import {DynamicConstraintExpr} from './expr/DynamicConstraintExpr';
import {LogicalExpr} from './expr/LogicalExpr';
import {LogicalOperator} from './expr/LogicalOperator';
import {Expression} from './expr/Expression';
import {QueryField} from './QueryField';
import {QueryFields} from './QueryFields';

export class FulltextSearchExpression {

    static create(searchString: string, queryFields: QueryFields): Expression {

        if (searchString == null) {
            return null;
        }
        let args: ValueExpr[] = [];

        args.push(ValueExpr.stringValue(queryFields.toString()));
        args.push(ValueExpr.stringValue(searchString));
        args.push(ValueExpr.stringValue('AND'));

        let fulltextExp: FunctionExpr = new FunctionExpr('fulltext', args);
        let fulltextDynamicExpr: DynamicConstraintExpr = new DynamicConstraintExpr(fulltextExp);

        let nGramExpr: FunctionExpr = new FunctionExpr('ngram', args);
        let nGramDynamicExpr: DynamicConstraintExpr = new DynamicConstraintExpr(nGramExpr);

        return new LogicalExpr(fulltextDynamicExpr, LogicalOperator.OR, nGramDynamicExpr);
    }
}

export class FulltextSearchExpressionBuilder {

    queryFields: QueryFields = new QueryFields();

    searchString: string;

    addField(queryField: QueryField): FulltextSearchExpressionBuilder {
        this.queryFields.add(queryField);
        return this;
    }

    setSearchString(searchString: string): FulltextSearchExpressionBuilder {
        this.searchString = searchString;
        return this;
    }

    build(): Expression {
        return FulltextSearchExpression.create(this.searchString, this.queryFields);
    }

}
