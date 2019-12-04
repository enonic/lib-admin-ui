module api.rest {

    import ExceptionType = api.ExceptionType;

    export class RequestError extends api.Exception {

        private statusCode: number;

        constructor(statusCode: number, errorMsg: string) {
            const notifyMsg: string = (statusCode > 0) ? errorMsg : api.util.i18n('notify.no_connection');
            const type: ExceptionType = (statusCode >= 400 && statusCode < 500) ? ExceptionType.WARNING : ExceptionType.ERROR;

            super(notifyMsg, type);

            this.statusCode = statusCode;
        }

        getStatusCode(): number {
            return this.statusCode;
        }

        isNotFound(): boolean {
            return this.statusCode === StatusCode.NOT_FOUND;
        }
    }
}
