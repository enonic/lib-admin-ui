import {MenuButtonProgressBarManager} from '../button/MenuButtonProgressBarManager';
import {TaskState} from '../../task/TaskState';
import {i18n} from '../../util/Messages';
import {DivEl} from '../../dom/DivEl';
import {ManagedActionManager} from '../../managedaction/ManagedActionManager';
import {ManagedActionExecutor} from '../../managedaction/ManagedActionExecutor';
import {ManagedActionState} from '../../managedaction/ManagedActionState';
import {TaskEvent, TaskEventType} from '../../task/TaskEvent';
import {TaskInfo} from '../../task/TaskInfo';
import {TaskProgress} from '../../task/TaskProgress';
import {Element} from '../../dom/Element';
import {Body} from '../../dom/Body';
import {TaskId} from '../../task/TaskId';
import {GetTaskInfoRequest} from '../../task/GetTaskInfoRequest';
import {ModalDialog} from './ModalDialog';
import {ProgressBar} from '../ProgressBar';
import {ProgressBarManagerState} from './ProgressBarManagerState';
import {showError, showSuccess, showWarning} from '../../notify/MessageBus';

export type ManagedActionsModalDialog = ModalDialog & ManagedActionExecutor;

export interface ProgressBarManagerConfig {
    processingLabel: string;
    processHandler: () => void;
    unlockControlsHandler?: () => void;
    createProcessingMessage?: () => Element;
    managingElement: ManagedActionsModalDialog;
}

export class ProgressBarManager {

    static processingClass: string = 'is-processing';

    private managingElement: ManagedActionsModalDialog;

    private progressBar: ProgressBar;

    private processingMessageContainer: Element;

    private createProcessingMessage: () => Element;

    private processingLabel: string;

    private processHandler: () => void;

    private unlockControlsHandler: () => void;

    private progressCompleteListeners: ((taskState: TaskState) => void)[] = [];

    private state: ProgressBarManagerState = ProgressBarManagerState.DISABLED;

    private taskHandler: (event: TaskEvent) => void;

    constructor(config: ProgressBarManagerConfig) {
        this.managingElement = config.managingElement;
        this.processHandler = config.processHandler;
        this.processingLabel = config.processingLabel;
        this.unlockControlsHandler = config.unlockControlsHandler || (() => {/*empty*/
        });
        this.createProcessingMessage = config.createProcessingMessage;

        ManagedActionManager.instance().addPerformer(this.managingElement);
        this.managingElement.onRemoved(() => ManagedActionManager.instance().removePerformer(this.managingElement));

        this.managingElement.addClass('progress-manageable');
    }

    isEnabled(): boolean {
        return this.state === ProgressBarManagerState.ENABLED;
    }

    isActive(): boolean {
        return this.state === ProgressBarManagerState.PREPARING || this.state === ProgressBarManagerState.ENABLED;
    }

    handleProcessingComplete() {
        if (this.isEnabled()) {
            this.disableProgressBar();
        } else {
            this.state = ProgressBarManagerState.DISABLED;
        }

        ManagedActionManager.instance().notifyManagedActionStateChanged(ManagedActionState.ENDED, this.managingElement);

        if (this.managingElement.isVisible()) {
            this.managingElement.close();
        }
    }

    onProgressComplete(listener: (taskState: TaskState) => void) {
        this.progressCompleteListeners.push(listener);
    }

    unProgressComplete(listener: (taskState: TaskState) => void) {
        this.progressCompleteListeners = this.progressCompleteListeners.filter(function (curr: (taskState: TaskState) => void) {
            return curr !== listener;
        });
    }

    pollTask(taskId: TaskId) {
        this.state = ProgressBarManagerState.PREPARING;
        ManagedActionManager.instance().notifyManagedActionStateChanged(ManagedActionState.PREPARING, this.managingElement);

        let taskEventsComing: boolean = false; // no events coming might mean that task is finished before we've got here

        this.taskHandler = (event: TaskEvent) => {
            if (!event.getTaskInfo().getId().equals(taskId)) {
                return;
            }

            if (event.getEventType() === TaskEventType.REMOVED) {
                return;
            }

            taskEventsComing = true;

            this.handleTaskEvent(event.getTaskInfo());
        };

        TaskEvent.on(this.taskHandler);

        // have to check if task was finished before we started listening task events
        new GetTaskInfoRequest(taskId).sendAndParse().then((taskInfo: TaskInfo) => {
            if (!taskEventsComing) {
                this.handleTaskEvent(taskInfo);
            }
        });
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
        Body.get().addClass(ProgressBarManager.processingClass);
        this.state = ProgressBarManagerState.ENABLED;
        ManagedActionManager.instance().notifyManagedActionStateChanged(ManagedActionState.STARTED, this.managingElement);

        MenuButtonProgressBarManager.getProgressBar().setValue(0);
        MenuButtonProgressBarManager.getProgressBar().setLabel(this.processingLabel);
        this.unlockControlsHandler();
        this.createProcessingMessageContainer();
        this.createProgressBar();
        MenuButtonProgressBarManager.updateProgressHandler(this.processHandler);
    }

    private disableProgressBar() {
        this.managingElement.removeClass(ProgressBarManager.processingClass);
        Body.get().removeClass(ProgressBarManager.processingClass);
        this.state = ProgressBarManagerState.DISABLED;
    }

    private setProgressValue(value: number) {
        if (this.state === ProgressBarManagerState.ENABLED) {
            this.progressBar.setValue(value);
            if (!Body.get().isShowingModalDialog()) {
                MenuButtonProgressBarManager.getProgressBar().setValue(value);
            }
        }
    }

    private handleSucceeded(message: string) {
        this.setProgressValue(100);
        showSuccess(message);
        this.notifyProgressComplete(TaskState.FINISHED);
        this.handleProcessingComplete();
    }

    private handleFailed(message: string) {
        showError(i18n('notify.process.failed', message));
        this.notifyProgressComplete(TaskState.FAILED);
        this.handleProcessingComplete();
    }

    private handleWarning(message: string) {
        showWarning(message);
        this.notifyProgressComplete(TaskState.FAILED);
        this.handleProcessingComplete();
    }

    private notifyProgressComplete(taskState: TaskState) {
        this.progressCompleteListeners.forEach((listener) => {
            listener(taskState);
        });
    }

    private handleTaskEvent(taskInfo: TaskInfo) {
        if (taskInfo.getState() === TaskState.FINISHED) {
            this.handleTaskFinished(taskInfo);
        } else if (taskInfo.getState() === TaskState.FAILED) {
            this.handleTaskFailed(taskInfo);
        } else {
            this.handleTaskProgress(taskInfo);
        }
    }

    private handleTaskFinished(taskInfo: TaskInfo) {
        const progressInfoJson: any = this.getProgressInfoJson(taskInfo.getProgress());

        switch (progressInfoJson.state) {
        case 'ERROR':
            this.handleFailed(progressInfoJson.message);
            break;
        case 'SUCCESS':
            this.handleSucceeded(progressInfoJson.message);
            break;
        case 'WARNING':
            this.handleWarning(progressInfoJson.message);
            break;
        }

        TaskEvent.un(this.taskHandler);
    }

    private handleTaskFailed(taskInfo: TaskInfo) {
        const progressInfoJson: any = this.getProgressInfoJson(taskInfo.getProgress());
        this.handleFailed(progressInfoJson.message);

        TaskEvent.un(this.taskHandler);
    }

    private handleTaskProgress(taskInfo: TaskInfo) {
        if (!this.isEnabled()) {
            this.enableProgressBar();
        }
        this.setProgressValue(taskInfo.getProgressPercentage());
    }

    private getProgressInfoJson(taskProgress: TaskProgress): any {
        let progressJson;
        try {
            progressJson = JSON.parse(taskProgress.getInfo());
        } catch (e) {
            // the info is not in JSON format
            progressJson = {
                state: 'SUCCESS',
                message: taskProgress.getInfo()
            };
        }

        return progressJson;
    }
}
