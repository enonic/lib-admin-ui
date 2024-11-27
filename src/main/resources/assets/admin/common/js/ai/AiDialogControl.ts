import * as Q from 'q';
import {Button} from '../ui/button/Button';
import {i18n} from '../util/Messages';
import {AiContentOperatorOpenDialogEvent} from './event/AiContentOperatorOpenDialogEvent';
import {AIContextUpdatedEvent} from './event/internal/AIContextUpdatedEvent';

export class AiDialogControl
    extends Button {

    private dataPath?: string;

    constructor() {
        super();

        this.initListeners();
    }

    setDataPath(dataPath: string): AiDialogControl {
        this.dataPath = dataPath;
        return this;
    }

    setActive(active: boolean): AiDialogControl {
        this.toggleClass('active', active);
        return this;
    }

    getDataPath(): string {
        return this.dataPath;
    }

    protected initListeners(): void {
        this.onClicked(() => {
            if (this.dataPath) {
                new AiContentOperatorOpenDialogEvent(this.dataPath).fire();
            }
        });

        AIContextUpdatedEvent.on((event) => {
            this.setActive(!!event.context && !!this.dataPath && this.dataPath === event.context);
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('ai-dialog-control').setTitle(i18n('ai.action.contentOperator.use'));

            return rendered;
        });
    }
}
