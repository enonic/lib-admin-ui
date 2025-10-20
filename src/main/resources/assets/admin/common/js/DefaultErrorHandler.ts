import {ObjectHelper} from './ObjectHelper';
import {Exception, ExceptionType} from './Exception';
import {showError, showFeedback, showWarning} from './notify/MessageBus';

export class DefaultErrorHandler {

    static handle(error: any): void {
        if (ObjectHelper.iFrameSafeInstanceOf(error, Exception)) {
            const message = error.getMessage();

            switch (error.getType()) {
            case ExceptionType.ERROR:
                console.error(message);
                showError(message);
                break;
            case ExceptionType.WARNING:
                console.warn(message);
                showWarning(message);
                break;
            case ExceptionType.INFO:
                console.info(message);
                showFeedback(message);
                break;
            }
        } else {
            console.error(error);
            showError(error.toString().replace(/^Error: /, ''));
            throw error;
        }

    }

}
