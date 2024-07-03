import {Button} from '../../ui/button/Button';
import {i18n} from '../../util/Messages';
import {EnonicAiOpenDialogEvent} from '../event/EnonicAiOpenDialogEvent';
import {DivEl} from '../../dom/DivEl';
import * as Q from 'q';
import {AI_HELPER_STATE} from '../AIHelperState';

export class AIActionButton
    extends DivEl {

    private static baseClass = 'ai-button-container';

    private dataPath?: string;

    private button: Button;

    private loader: DivEl;

    constructor() {
        super();

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.button = new Button().addClass(`${AIActionButton.baseClass}-icon icon-ai`) as Button;
        this.loader = new DivEl(`${AIActionButton.baseClass}-loader`);
        this.setTitle(i18n('action.saga'));
        this.setState(AI_HELPER_STATE.DEFAULT);
    }

    setState(state: AI_HELPER_STATE): this {
        this.setClass(`${AIActionButton.baseClass} ${state}`);

        return this;
    }

    setDataPath(dataPath: string): AIActionButton {
        this.dataPath = dataPath;
        return this;
    }

    getDataPath(): string {
        return this.dataPath;
    }

    protected initListeners(): void {
        this.button.onClicked(() => {
            if (this.dataPath) {
                new EnonicAiOpenDialogEvent(this.dataPath).fire();
            }
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(this.loader, this.button);

            return rendered;
        });
    }
}
