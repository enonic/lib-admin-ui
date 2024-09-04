import {ObjectHelper} from './ObjectHelper';
import {Application} from './app/Application';
import {ShowAppLauncherEvent} from './app/ShowAppLauncherEvent';
import {AccessDeniedException} from './AccessDeniedException';
import {Exception, ExceptionType} from './Exception';
import {showError, showFeedback, showWarning} from './notify/MessageBus';

export class DefaultErrorHandler {

    static handle(error: any): void {
        if (ObjectHelper.iFrameSafeInstanceOf(error, AccessDeniedException)) {
            let application: Application = Application.getApplication();
            let wnd = application.getWindow();
            new ShowAppLauncherEvent(application, true).fire(wnd.parent);
            new ShowAppLauncherEvent(application, true).fire(wnd);
        } else if (ObjectHelper.iFrameSafeInstanceOf(error, Exception)) {
            let message = error.getMessage();

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
