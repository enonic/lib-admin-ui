import Q from 'q';
import {Button} from '../../../ui/button/Button';
import {i18n} from '../../../util/Messages';
import {AiContentOperatorOpenDialogEvent} from '../../event/AiContentOperatorOpenDialogEvent';

export class AiDialogControl
    extends Button {

    private dataPath?: string;

    constructor(dataPath?: string) {
        super();

        this.dataPath = dataPath;
        this.initListeners();
    }

    setDataPath(dataPath: string): AiDialogControl {
        this.dataPath = dataPath;
        return this;
    }

    setActive(active: boolean): AiDialogControl {
        this.toggleClass('active', !!active);
        return this;
    }

    setHasActiveDescendant(hasActiveDescendant: boolean): AiDialogControl {
        this.toggleClass('has-active-descendant', !!hasActiveDescendant);
        return this;
    }

    getDataPath(): string {
        return this.dataPath;
    }

    protected initListeners(): void {
        this.onClicked((event: MouseEvent) => {
            if (this.dataPath) {
                event.stopPropagation();
                new AiContentOperatorOpenDialogEvent(this.dataPath).fire();
            }
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            (this.addClass('ai-dialog-control') as Button)
                .setTitle(i18n('ai.action.contentOperator.use'), false);

            return rendered;
        });
    }
}
