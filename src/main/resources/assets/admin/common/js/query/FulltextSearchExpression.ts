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

        const args: ValueExpr[] = [];
        const escapedSearchString: string = FulltextSearchExpression.escapeString(searchString);

        args.push(ValueExpr.stringValue(queryFields.toString()));
        args.push(ValueExpr.stringValue(escapedSearchString));
        args.push(ValueExpr.stringValue('AND'));

        const fulltextExp: FunctionExpr = new FunctionExpr('fulltext', args);
        const fulltextDynamicExpr: DynamicConstraintExpr = new DynamicConstraintExpr(fulltextExp);

        const nGramExpr: FunctionExpr = new FunctionExpr('ngram', args);
        const nGramDynamicExpr: DynamicConstraintExpr = new DynamicConstraintExpr(nGramExpr);

        return new LogicalExpr(fulltextDynamicExpr, LogicalOperator.OR, nGramDynamicExpr);
    }

    static escapeString(value: string): string {
        return value.replace(/((\&\&)|(\|\|)|[+-=><!(){}\[\]^"~*?:\\/])/g, `\\$1`);
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
