import {Exception, ExceptionType} from './Exception';

export class AccessDeniedException
    extends Exception {

    constructor(message: string) {
        super(message, ExceptionType.WARNING);
    }

}
