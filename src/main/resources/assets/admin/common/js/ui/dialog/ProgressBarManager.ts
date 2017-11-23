module api.ui.dialog {
    import MenuButtonProgressBarManager = api.ui.button.MenuButtonProgressBarManager;
    import TaskState = api.task.TaskState;
    import i18n = api.util.i18n;
    import DivEl = api.dom.DivEl;

    export interface ProgressBarManagerConfig {
        processingLabel: string;
        processHandler: () => void;
        unlockControlsHandler?: () => void;
        createProcessingMessage?: () => api.dom.Element;
        managingElement: ModalDialog;
    }

    export class ProgressBarManager {

        // If the content is still being processed after this time, show the progress bar (in ms)
        static progressBarDelay: number = 200;

        // Interval of task polling when processing the content (in ms)
        static pollInterval: number = 500;

        static processingClass: string = 'is-processing';

        private managingElement: ModalDialog;

        private progressBar: ProgressBar;

        private processingMessageContainer: api.dom.Element;

        private createProcessingMessage: () => api.dom.Element;

        private processingLabel: string;

        private processHandler: () => void;

        private unlockControlsHandler: () => void;

        private progressCompleteListeners: ((taskState: TaskState) => void)[] = [];

        private enabled: boolean = false;

        constructor(config: ProgressBarManagerConfig) {
            this.managingElement = config.managingElement;
            this.processHandler = config.processHandler;
            this.processingLabel = config.processingLabel;
            this.unlockControlsHandler = config.unlockControlsHandler || (() => { /*empty*/
            });
            this.createProcessingMessage = config.createProcessingMessage;

            this.managingElement.addClass('progress-manageable');
        }

        private createProgressBar() {
            if (this.progressBar) {
                this.progressBar.setValue(0);
            } else {
                this.progressBar = new ProgressBar(0);
                this.managingElement.appendChildToContentPanel(this.progressBar);
            }
        }

        private createProcessingMessageContainer() {
            if (this.createProcessingMessage) {
                if (this.processingMessageContainer) {
                    this.processingMessageContainer.removeChildren();
                    this.processingMessageContainer.appendChild(this.createProcessingMessage());
                } else {
                    this.processingMessageContainer = new DivEl('progress-message');
                    this.processingMessageContainer.appendChild(this.createProcessingMessage());
                    this.managingElement.appendChildToContentPanel(this.processingMessageContainer);
                }
            }
        }

        private enableProgressBar() {
            this.managingElement.addClass(ProgressBarManager.processingClass);
            api.dom.Body.get().addClass(ProgressBarManager.processingClass);
            this.enabled = true;

            MenuButtonProgressBarManager.getProgressBar().setValue(0);
            MenuButtonProgressBarManager.getProgressBar().setLabel(this.processingLabel);
            this.unlockControlsHandler();
            this.createProcessingMessageContainer();
            this.createProgressBar();
            MenuButtonProgressBarManager.updateProgressHandler(this.processHandler);
        }

        private disableProgressBar() {
            this.managingElement.removeClass(ProgressBarManager.processingClass);
            api.dom.Body.get().removeClass(ProgressBarManager.processingClass);
            this.enabled = false;
        }

        isEnabled(): boolean {
            return this.enabled;
        }

        private setProgressValue(value: number) {
            if (this.isEnabled()) {
                this.progressBar.setValue(value);
                if (!api.dom.Body.get().isShowingModalDialog()) {
                    MenuButtonProgressBarManager.getProgressBar().setValue(value);
                }
            }
        }

        handleProcessingComplete() {
            if (this.isEnabled()) {
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

        pollTask(taskId: api.task.TaskId, elapsed: number = 0, instant?: boolean) {
            const interval = ProgressBarManager.pollInterval;
            const checkUpdates = () => {
                if (!this.isEnabled() && (elapsed >= ProgressBarManager.progressBarDelay || instant)) {
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

            };
            if (instant) {
                checkUpdates();
            } else {
                setTimeout(checkUpdates, interval);
            }
        }
    }
}
