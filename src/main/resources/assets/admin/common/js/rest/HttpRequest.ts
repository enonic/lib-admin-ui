module api.rest {

    export interface HttpRequest<TYPE> {

        sendAndParse(): wemQ.Promise<TYPE>;

    }
}
