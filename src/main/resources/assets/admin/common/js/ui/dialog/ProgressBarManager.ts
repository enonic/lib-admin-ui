module api.ui.dialog {
    import MenuButtonProgressBarManager = api.ui.button.MenuButtonProgressBarManager;
    import TaskState = api.task.TaskState;
    import i18n = api.util.i18n;

    export interface ProgressBarManagerConfig {
        processingClass: string;
        processingLabel: string;
        processHandler: () => void;
        unlockControlsHandler?: () => void;
        managingElement: ModalDialog;
    }

    export class ProgressBarManager {

        // If the content is still being processed after this time, show the progress bar (in ms)
        static progressBarDelay: number = 200;

        // Interval of task polling when processing the content (in ms)
        static pollInterval: number = 500;

        private managingElement: ModalDialog;

        private progressBar: ProgressBar;

        private processingLabel: string;

        private processingClass: string;

        private processHandler: () => void;

        private unlockControlsHandler: () => void;

        private progressCompleteListeners: ((taskState: TaskState) => void)[] = [];

        constructor(config: ProgressBarManagerConfig) {
            this.managingElement = config.managingElement;
            this.processingClass = config.processingClass;
            this.processHandler = config.processHandler;
            this.processingLabel = config.processingLabel;
            this.unlockControlsHandler = config.unlockControlsHandler;
        }

        private createProgressBar(): ProgressBar {
            if (this.progressBar) {
                this.progressBar.setValue(0);
                return this.progressBar;
            }

            const progressBar = new ProgressBar(0);
            this.managingElement.appendChildToContentPanel(progressBar);

            return progressBar;
        }

        private enableProgressBar() {
            this.managingElement.addClass(this.processingClass);
            api.dom.Body.get().addClass(this.processingClass);

            MenuButtonProgressBarManager.getProgressBar().setValue(0);
            MenuButtonProgressBarManager.getProgressBar().setLabel(this.processingLabel);
            this.unlockControlsHandler();
            this.progressBar = this.createProgressBar();
            MenuButtonProgressBarManager.updateProgressHandler(this.processHandler);
        }

        private disableProgressBar() {
            this.managingElement.removeClass(this.processingClass);
            api.dom.Body.get().removeClass(this.processingClass);
        }

        private isProgressBarEnabled() {
            return this.managingElement.hasClass(this.processingClass);
        }

        private setProgressValue(value: number) {
            if (this.isProgressBarEnabled()) {
                this.progressBar.setValue(value);
                if (!api.dom.Body.get().isShowingModalDialog()) {
                    MenuButtonProgressBarManager.getProgressBar().setValue(value);
                }
            }
        }

        handleProcessingComplete() {
            if (this.isProgressBarEnabled()) {
                this.disableProgressBar();
            }

            if (this.managingElement.isVisible()) {
                this.managingElement.close();
            }
        }

        private handleSucceeded() {
            this.setProgressValue(100);
            this.handleProcessingComplete();
        }

        private handleFailed() {
            this.handleProcessingComplete();
        }

        onProgressComplete(listener: (taskState: TaskState) => void) {
            this.progressCompleteListeners.push(listener);
        }

        unProgressComplete(listener: (taskState: TaskState) => void) {
            this.progressCompleteListeners = this.progressCompleteListeners.filter(function (curr: (taskState: TaskState) => void) {
                return curr !== listener;
            });
        }

        private notifyProgressComplete(taskState: TaskState) {
            this.progressCompleteListeners.forEach((listener) => {
                listener(taskState);
            });
        }

        pollTask(taskId: api.task.TaskId, elapsed: number = 0) {
            const interval = ProgressBarManager.pollInterval;
            setTimeout(() => {
                if (!this.isProgressBarEnabled() && elapsed >= ProgressBarManager.progressBarDelay) {
                    this.enableProgressBar();
                }

                new api.task.GetTaskInfoRequest(taskId).sendAndParse().then((task: api.task.TaskInfo) => {
                    let state = task.getState();
                    if (!task) {
                        return; // task probably expired, stop polling
                    }

                    const progress = task.getProgress();

                    switch (state) {
                    case TaskState.FINISHED:
                        this.handleSucceeded();
                        api.notify.showSuccess(progress.getInfo());
                        this.notifyProgressComplete(TaskState.FINISHED);
                        break;
                    case TaskState.FAILED:
                        this.handleFailed();
                        api.notify.showError(i18n('notify.process.failed', progress.getInfo()));
                        this.notifyProgressComplete(TaskState.FAILED);
                        break;
                    default:
                        this.setProgressValue(task.getProgressPercentage());
                        this.pollTask(taskId, elapsed + interval);
                    }
                }).catch((reason: any) => {
                    this.handleProcessingComplete();

                    api.DefaultErrorHandler.handle(reason);
                }).done();

            }, interval);
        }

        getProcessingClass() {
            return this.processingClass;
        }
    }
}
