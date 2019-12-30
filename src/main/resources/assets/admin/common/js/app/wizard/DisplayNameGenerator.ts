export interface DisplayNameGenerator {

    hasExpression(): boolean;

    execute(): string;
}
