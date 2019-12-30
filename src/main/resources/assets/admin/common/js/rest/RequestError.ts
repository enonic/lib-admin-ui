import {Exception, ExceptionType} from '../Exception';
import {StatusCode} from './StatusCode';
import {i18n} from '../util/Messages';

export class RequestError extends Exception {

    private statusCode: number;

        constructor(statusCode: number, errorMsg: string) {
            const notifyMsg: string = (statusCode > 0) ? errorMsg : i18n('notify.no_connection');
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
