module api.app.wizard {

    export interface DisplayNameGenerator {

        hasExpression(): boolean;

        execute(): string;
    }
}
