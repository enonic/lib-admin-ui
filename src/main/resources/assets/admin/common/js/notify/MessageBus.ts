module api.notify {

    export function showSuccess(message: string, autoHide: boolean = true, instant?: boolean): string {
        return NotifyManager.get().showSuccess(message, autoHide, instant);
    }

    export function showFeedback(message: string, autoHide: boolean = true, instant?: boolean): string {
        return NotifyManager.get().showFeedback(message, autoHide, instant);
    }

    export function showError(message: string, autoHide: boolean = true, instant?: boolean): string {
        return NotifyManager.get().showError(message, autoHide, instant);
    }

    export function showWarning(message: string, autoHide: boolean = true, instant?: boolean): string {
        return NotifyManager.get().showWarning(message, autoHide, instant);
    }

    export function hideNotification(messageId: string, instant?: boolean) {
        NotifyManager.get().hide(messageId, instant);
    }

}
