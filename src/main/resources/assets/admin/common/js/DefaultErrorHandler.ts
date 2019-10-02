import {ObjectHelper} from './ObjectHelper';
import {AppApplication} from './app/AppApplication';
import {ShowAppLauncherEvent} from './app/ShowAppLauncherEvent';
import {AccessDeniedException} from './AccessDeniedException';
import {Exception, ExceptionType} from './Exception';
import {showError, showFeedback, showWarning} from './notify/MessageBus';

export class DefaultErrorHandler {

    static handle(error: any) {

        if (ObjectHelper.iFrameSafeInstanceOf(error, Error)) {
            // Rethrowing Error so that we will get a nice stack trace in the console.
            console.error(error);
            throw error;
        } else if (ObjectHelper.iFrameSafeInstanceOf(error, AccessDeniedException)) {
            let application: AppApplication = AppApplication.getApplication();
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
            showError(error.toString());
            throw error;
        }

    }

}
